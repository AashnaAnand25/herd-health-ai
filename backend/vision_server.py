"""
HerdSense Vision Server — YOLOv8 real-time behavior classification.
Run from backend directory (with venv activated):
     pip install ultralytics flask flask-cors opencv-python
     python vision_server.py
Then open the Vision tab in the app; stream at http://localhost:5001/video_feed
"""
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
from ultralytics import YOLO
import threading
import time
import json
import os
import base64
import tempfile

app = Flask(__name__)
CORS(app)

# Load YOLOv8 model (downloads automatically on first run)
# Use real trained model if available, then custom trained, then default
if os.path.exists("real_cattle_model.pt"):
    model_path = "real_cattle_model.pt"
    print("🐄 Using REAL CBVD-5 trained model!")
elif os.path.exists("custom_trained_model.pt"):
    model_path = "custom_trained_model.pt"
    print("🤖 Using custom trained model!")
else:
    model_path = "yolov8n.pt"
    print("📦 Using default model")
model = YOLO(model_path)

def _default_results(camera_ok=True):
    return {
        "behavior": "Standing" if camera_ok else "Camera unavailable",
        "confidence": 0.91 if camera_ok else 0.0,
        "risk": "LOW",
        "alert": None if camera_ok else "Grant Terminal camera access in System Settings → Privacy & Security → Camera, then restart the vision server.",
        "detections": 0,
        "timestamp": time.time(),
        "camera_available": camera_ok,
    }


def _make_placeholder_frame():
    """Return a 640x480 BGR image with 'Camera unavailable' text."""
    import numpy as np
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img[:] = (40, 40, 40)
    cv2.putText(
        img, "Camera unavailable",
        (120, 240), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (200, 200, 200), 2
    )
    cv2.putText(
        img, "Grant Terminal camera access: System Settings -> Privacy -> Camera",
        (40, 290), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1
    )
    return img


latest_results = None  # set below after camera check
camera_paused = False  # toggled by /pause_camera and /resume_camera

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
camera_available = cap.isOpened() and cap.read()[0]
# Placeholder frame when camera fails (so /video_feed still sends something)
placeholder_frame = None
if not camera_available:
    place = cv2.imread("placeholder_camera.png") if os.path.exists("placeholder_camera.png") else None
    if place is None:
        place = _make_placeholder_frame()
    _, buf = cv2.imencode(".jpg", place)
    placeholder_frame = buf.tobytes()
output_frame = placeholder_frame if not camera_available else None
latest_results = _default_results(camera_available)
lock = threading.Lock()

# Prefer MPS on Apple Silicon, fallback to CPU
try:
    import torch
    device = "mps" if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available() else "cpu"
except Exception:
    device = "cpu"


def classify_behavior(detections):
    """Map YOLO detections to cattle-style behaviors for demo."""
    if not detections:
        return "No animal detected", 0.0, "LOW"
    behaviors = []
    for det in detections:
        label = det["label"]
        conf = det["confidence"]
        box = det["box"]
        width = box[2] - box[0]
        height = box[3] - box[1]
        aspect_ratio = width / height if height > 0 else 1

        # Map real CBVD-5 classes to cattle behaviors
        if label == "stand":
            behaviors.append(("Standing/Walking", conf, "LOW"))
        elif label == "lying_down":
            behaviors.append(("Lying Down", conf, "MEDIUM"))
        elif label == "foraging":
            behaviors.append(("Grazing", conf, "LOW"))
        elif label == "drinking_water":
            behaviors.append(("Drinking", conf, "LOW"))
        elif label == "rumination":
            behaviors.append(("Ruminating", conf, "LOW"))
        elif label == "cow_eating":
            behaviors.append(("Grazing", conf, "LOW"))
        elif label == "cow_walking":
            behaviors.append(("Standing/Walking", conf, "LOW"))
        elif label == "cow_lying_down":
            behaviors.append(("Lying Down", conf, "MEDIUM"))
        elif label == "cow_standing":
            behaviors.append(("Standing", conf, "LOW"))
        elif label == "cow_distress":
            behaviors.append(("Abnormal Gait", conf, "HIGH"))
        elif label == "cow_abnormal_movement":
            behaviors.append(("Abnormal Gait", conf, "HIGH"))
        else:
            behaviors.append((f"Detected: {label}", conf, "LOW"))

    return behaviors[0] if behaviors else ("No animal detected", 0.0, "LOW")


COCO_PERSON_CLASS = 0  # COCO class index for "person"


def classify_human_behavior(xyxy, frame_h, frame_w):
    """Classify human movement from bounding box geometry."""
    x1, y1, x2, y2 = xyxy
    width = x2 - x1
    height = y2 - y1
    aspect = width / height if height > 0 else 1
    box_area_frac = (width * height) / (frame_w * frame_h) if frame_w * frame_h > 0 else 0
    y_center_frac = ((y1 + y2) / 2) / frame_h if frame_h > 0 else 0.5

    if aspect > 1.5:
        return "Lying Down", "MEDIUM"
    if aspect < 0.45:
        # Very tall narrow box — likely standing upright
        return "Standing", "LOW"
    if aspect < 0.65 and y_center_frac > 0.55:
        return "Standing", "LOW"
    if 0.65 <= aspect <= 1.0 and box_area_frac < 0.12:
        return "Walking", "LOW"
    if 0.65 <= aspect <= 1.2:
        return "Crouching / Bending", "LOW"
    return "Standing", "LOW"


def process_frames():
    global output_frame, latest_results
    if not camera_available:
        while True:
            time.sleep(1)
        return
    while True:
        if camera_paused:
            time.sleep(0.1)
            continue
        ret, frame = cap.read()
        if not ret:
            continue
        try:
            results = model(frame, verbose=False, device=device)
        except Exception:
            results = model(frame, verbose=False, device="cpu")
        detections = []
        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls]
                xyxy = box.xyxy[0].tolist()
                cv2.rectangle(
                    frame,
                    (int(xyxy[0]), int(xyxy[1])),
                    (int(xyxy[2]), int(xyxy[3])),
                    (0, 255, 0),
                    2,
                )
                cv2.putText(
                    frame,
                    f"{label} {conf:.2f}",
                    (int(xyxy[0]), int(xyxy[1] - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0, 255, 0),
                    2,
                )
                detections.append({"label": label, "confidence": conf, "box": xyxy})

        # --- Human fallback: if no cattle detected, run COCO person detection ---
        subject = "animal"
        if not detections:
            frame_h_px, frame_w_px = frame.shape[:2]
            try:
                h_results = coco_model(frame, verbose=False, device=device, conf=0.35, classes=[COCO_PERSON_CLASS])
            except Exception:
                h_results = coco_model(frame, verbose=False, device="cpu", conf=0.35, classes=[COCO_PERSON_CLASS])
            for r in h_results:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    xyxy = box.xyxy[0].tolist()
                    h_behavior, _ = classify_human_behavior(xyxy, frame_h_px, frame_w_px)
                    color = (255, 165, 0)  # orange for humans
                    cv2.rectangle(frame, (int(xyxy[0]), int(xyxy[1])), (int(xyxy[2]), int(xyxy[3])), color, 2)
                    cv2.putText(
                        frame,
                        f"person: {h_behavior} {conf:.2f}",
                        (int(xyxy[0]), max(int(xyxy[1]) - 10, 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2,
                    )
                    detections.append({"label": f"person:{h_behavior}", "confidence": conf, "box": xyxy})
            if detections:
                subject = "human"

        behavior, confidence, risk = classify_behavior(detections)
        # For human detections, unpack the label properly
        if subject == "human" and detections:
            best = max(detections, key=lambda d: d["confidence"])
            raw_label = best["label"]  # "person:Standing" etc.
            behavior = raw_label.split(":", 1)[1] if ":" in raw_label else raw_label
            confidence = best["confidence"]
            risk = "LOW"

        alert = None
        if risk == "HIGH":
            alert = f"Abnormal behavior detected — {behavior}"
        elif behavior == "Lying Down" and confidence > 0.7:
            alert = "Extended lying detected — possible health concern"
        with lock:
            latest_results = {
                "behavior": behavior,
                "confidence": round(confidence, 2),
                "risk": risk,
                "alert": alert,
                "detections": len(detections),
                "subject": subject,
                "timestamp": time.time(),
                "camera_available": True,
            }
            _, buffer = cv2.imencode(".jpg", frame)
            output_frame = buffer.tobytes()
        time.sleep(0.05)


def generate_frames():
    global output_frame
    while True:
        with lock:
            frame = output_frame
        if frame is not None:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
            )
        time.sleep(0.05)


@app.route("/video_feed")
def video_feed():
    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


@app.route("/results")
def get_results():
    with lock:
        return jsonify(latest_results)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/pause_camera", methods=["POST"])
def pause_camera():
    global camera_paused
    camera_paused = True
    return jsonify({"paused": True})


@app.route("/resume_camera", methods=["POST"])
def resume_camera():
    global camera_paused
    camera_paused = False
    return jsonify({"paused": False})


@app.route("/camera_status")
def camera_status():
    return jsonify({"paused": camera_paused, "available": camera_available})


def _classify_coco_cow(xyxy, frame_h):
    """Classify cattle behavior from a COCO 'cow' detection bounding box."""
    x1, y1, x2, y2 = xyxy
    width = x2 - x1
    height = y2 - y1
    aspect = width / height if height > 0 else 1
    # Lying down: box is wide relative to height
    if aspect > 1.6:
        return "Lying Down", "MEDIUM"
    # Grazing: head near bottom third of frame (low y1 relative to frame)
    box_bottom_frac = y2 / frame_h if frame_h > 0 else 1
    if aspect < 0.9 and box_bottom_frac > 0.6:
        return "Grazing", "LOW"
    return "Standing/Walking", "LOW"


# Load COCO model for video analysis fallback (large model = better accuracy)
_coco_model_path = "yolov8l.pt" if os.path.exists("yolov8l.pt") else "yolov8n.pt"
coco_model = YOLO(_coco_model_path)
COCO_COW_CLASS = 19  # COCO class index for "cow"


@app.route("/analyze_video", methods=["POST"])
def analyze_video():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    video_file = request.files["video"]
    suffix = os.path.splitext(video_file.filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        video_file.save(tmp.name)
        tmp_path = tmp.name
    try:
        cap_v = cv2.VideoCapture(tmp_path)
        fps = cap_v.get(cv2.CAP_PROP_FPS) or 25
        total_frames = int(cap_v.get(cv2.CAP_PROP_FRAME_COUNT))
        # Sample ~60 frames evenly across the video
        step = max(1, total_frames // 60)
        timeline = []
        frame_idx = 0
        thumb_b64 = None
        frame_h = int(cap_v.get(cv2.CAP_PROP_FRAME_HEIGHT))
        while True:
            ret, frame = cap_v.read()
            if not ret:
                break
            if frame_idx % step == 0:
                # First try with the COCO model (reliable cow detection)
                try:
                    res = coco_model(frame, verbose=False, device=device, conf=0.2, classes=[COCO_COW_CLASS])
                except Exception:
                    res = coco_model(frame, verbose=False, device="cpu", conf=0.2, classes=[COCO_COW_CLASS])
                cow_dets = []
                for r in res:
                    for box in r.boxes:
                        conf = float(box.conf[0])
                        xyxy = box.xyxy[0].tolist()
                        behavior, risk = _classify_coco_cow(xyxy, frame_h)
                        color = (0, 200, 100) if risk == "LOW" else (0, 165, 255) if risk == "MEDIUM" else (0, 0, 255)
                        cv2.rectangle(frame, (int(xyxy[0]), int(xyxy[1])), (int(xyxy[2]), int(xyxy[3])), color, 3)
                        cv2.putText(frame, f"{behavior} {conf:.2f}", (int(xyxy[0]), max(int(xyxy[1]) - 10, 10)),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                        cow_dets.append({"behavior": behavior, "confidence": conf, "risk": risk, "box": xyxy})
                if cow_dets:
                    # Pick highest-confidence detection
                    best = max(cow_dets, key=lambda d: d["confidence"])
                    behavior, confidence, risk = best["behavior"], best["confidence"], best["risk"]
                else:
                    # Fallback: try trained cattle model
                    try:
                        res2 = model(frame, verbose=False, device=device, conf=0.05)
                    except Exception:
                        res2 = model(frame, verbose=False, device="cpu", conf=0.05)
                    raw_dets = []
                    for r in res2:
                        for box in r.boxes:
                            raw_dets.append({"label": model.names[int(box.cls[0])], "confidence": float(box.conf[0]), "box": box.xyxy[0].tolist()})
                    behavior, confidence, risk = classify_behavior(raw_dets)
                timestamp_sec = round(frame_idx / fps, 2)
                entry = {"time": timestamp_sec, "behavior": behavior, "confidence": round(confidence, 2), "risk": risk, "detections": len(cow_dets)}
                timeline.append(entry)
                if thumb_b64 is None and len(cow_dets) > 0:
                    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
                    thumb_b64 = base64.b64encode(buf.tobytes()).decode()
            frame_idx += 1
        cap_v.release()
        if thumb_b64 is None and total_frames > 0:
            cap_v2 = cv2.VideoCapture(tmp_path)
            ret2, first_frame = cap_v2.read()
            cap_v2.release()
            if ret2:
                _, buf = cv2.imencode(".jpg", first_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
                thumb_b64 = base64.b64encode(buf.tobytes()).decode()
        if timeline:
            from collections import Counter
            detected = [e for e in timeline if e["detections"] > 0]
            behavior_counts = Counter(e["behavior"] for e in detected) if detected else Counter(e["behavior"] for e in timeline)
            dominant = behavior_counts.most_common(1)[0][0]
            avg_conf = round(sum(e["confidence"] for e in timeline) / len(timeline), 2)
            risks = [e["risk"] for e in timeline]
            max_risk = "HIGH" if "HIGH" in risks else ("MEDIUM" if "MEDIUM" in risks else "LOW")
            total_secs = round(total_frames / fps, 1)
        else:
            dominant, avg_conf, max_risk, total_secs = "No animal detected", 0.0, "LOW", 0
        return jsonify({
            "timeline": timeline,
            "summary": {
                "dominant_behavior": dominant,
                "avg_confidence": avg_conf,
                "max_risk": max_risk,
                "duration_sec": total_secs,
                "frames_analyzed": len(timeline),
            },
            "thumbnail": thumb_b64,
        })
    finally:
        os.unlink(tmp_path)


if __name__ == "__main__":
    thread = threading.Thread(target=process_frames, daemon=True)
    thread.start()
    print("Vision server running on http://localhost:5001")
    print("Video feed: http://localhost:5001/video_feed")
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
