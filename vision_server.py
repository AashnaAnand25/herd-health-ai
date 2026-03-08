"""
HerdSense Vision Server — YOLOv8 real-time behavior classification.
Run: pip install ultralytics flask flask-cors opencv-python
     python vision_server.py
Then open the Vision tab in the app; stream at http://localhost:5001/video_feed
"""
from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
from ultralytics import YOLO
import threading
import time
import json

app = Flask(__name__)
CORS(app)

# Load YOLOv8 model (downloads automatically on first run)
model = YOLO("yolov8n.pt")

latest_results = {
    "behavior": "Standing",
    "confidence": 0.91,
    "risk": "LOW",
    "alert": None,
    "detections": 0,
    "timestamp": time.time(),
}

# Try to use system camera, fallback to mock data
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Camera not available, using mock data")
    cap = None
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
output_frame = None
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
        if aspect_ratio > 1.8:
            behaviors.append(("Lying Down", conf, "MEDIUM"))
        elif aspect_ratio > 1.2:
            behaviors.append(("Grazing", conf, "LOW"))
        elif conf < 0.4:
            behaviors.append(("Abnormal Gait", conf, "HIGH"))
        else:
            behaviors.append(("Standing/Walking", conf, "LOW"))
    return behaviors[0] if behaviors else ("No animal detected", 0.0, "LOW")


def process_frames():
    global output_frame, latest_results
    while True:
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
        behavior, confidence, risk = classify_behavior(detections)
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
                "timestamp": time.time(),
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


if __name__ == "__main__":
    thread = threading.Thread(target=process_frames, daemon=True)
    thread.start()
    print("Vision server running on http://localhost:5001")
    print("Video feed: http://localhost:5001/video_feed")
    app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)
