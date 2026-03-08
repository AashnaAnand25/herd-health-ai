# Herd Health AI Dataset - Complete GitHub Package

## 📦 Dataset Overview

This is a **complete, GitHub-ready dataset** for cow behavior detection and health monitoring. The dataset is **synthetically generated** to ensure it can be freely distributed and used by anyone without copyright restrictions.

## 🎯 What's Included

### 📁 Dataset Structure
```
backend/data/
├── archive/                        # **Real CBVD-5 annotations** (train on this for real cow behavior)
│   ├── CBVD-5.csv                  # VIA-format annotations (stand, lying down, foraging, etc.)
│   └── annotations/                # AVA-style splits (optional)
├── archive_frames/                 # (You add this) CBVD frame images matching CBVD-5.csv
├── archive_yolo/                   # (Generated) YOLO format from archive — run convert_archive_to_yolo.py
│   ├── dataset.yaml
│   ├── images/ train val test
│   └── labels/ train val test
├── data/                           # **Synthetic generated dataset** (60 images, 10 classes)
│   ├── dataset_stats.json
│   ├── images/ train val test
│   └── labels/ train val test
├── dataset.yaml                    # YOLO config (synthetic or default)
├── generate_synthetic_dataset.py   # Generate synthetic images
├── convert_archive_to_yolo.py      # Convert archive CBVD-5.csv → YOLO for training
├── images/                         # (Alternative) All images (60 total) if not using data/
│   ├── train/ (42 images)          # Training set
│   ├── val/ (9 images)             # Validation set
│   └── test/ (9 images)            # Test set
├── labels/                          # YOLO annotations
│   ├── train/ (42 labels)          # Training annotations
│   ├── val/ (9 labels)             # Validation annotations
│   └── test/ (9 labels)            # Test annotations
└── samples/                        # Visual examples
    ├── sample_cow_eating.jpg       # Sample with bounding box
    ├── sample_cow_walking.jpg      # Sample with bounding box
    ├── sample_cow_lying_down.jpg   # Sample with bounding box
    ├── sample_cow_standing.jpg     # Sample with bounding box
    └── sample_cow_socializing.jpg  # Sample with bounding box
```

## 🏷️ Behavior Classes (10 Categories)

| Class ID | Behavior | Description | Use Case |
|----------|----------|-------------|-----------|
| 0 | cow_eating | Cow actively feeding | Nutrition monitoring |
| 1 | cow_walking | Normal movement | Activity tracking |
| 2 | cow_lying_down | Resting behavior | Health baseline |
| 3 | cow_standing | Normal posture | Posture analysis |
| 4 | cow_socializing | Herd interaction | Social health |
| 5 | cow_distress | Signs of illness | **CRITICAL ALERT** |
| 6 | cow_abnormal_movement | Movement issues | Early disease detection |
| 7 | piglet_nursing | Piglet feeding | Reproduction health |
| 8 | piglet_fall_risk | Danger detection | **CRITICAL ALERT** |
| 9 | birth_in_progress | Birthing process | **HIGH PRIORITY** |

## 📊 Dataset Statistics

- **Total Images**: 60
- **Training Images**: 42 (70%)
- **Validation Images**: 9 (15%)
- **Test Images**: 9 (15%)
- **Image Resolution**: 640x480 pixels
- **Format**: YOLO (normalized coordinates)
- **Annotations**: Bounding boxes with class labels

## 🚀 Quick Start

### Train on archive (real CBVD-5 data)
1. Download the [CBVD-5 cow behavior dataset](https://www.kaggle.com/datasets/fandaoerji/cbvd-5cow-behavior-video-dataset) from Kaggle.
2. Extract frame images (e.g. `618_00002.jpg`) into `backend/data/archive_frames/` (or extract from videos and name frames to match the CSV).
3. Convert annotations to YOLO and train:
```bash
cd backend/data
python convert_archive_to_yolo.py --images archive_frames
cd ..
python train_model.py   # uses data/archive_yolo/dataset.yaml automatically
```
Archive classes: **stand, lying_down, foraging, drinking_water, rumination** (5 classes).

### Train on synthetic (data/data/)
```bash
cd backend
python train_model.py --data data/dataset.yaml
# or generate more synthetic first: python data/generate_synthetic_dataset.py
```

### 1. Train the Model (default: archive if present, else synthetic)
```bash
cd backend
python train_model.py
```

### 2. Start the Backend
```bash
python main.py
```

### 3. Access Camera Monitoring
Navigate to: `http://localhost:3000/camera`

## 🎨 About the Synthetic Dataset

### Why Synthetic?
- ✅ **GitHub Friendly**: No copyright restrictions
- ✅ **Immediate Use**: No downloads required
- ✅ **Consistent Quality**: Perfect annotations
- ✅ **Small Size**: Fast cloning and training
- ✅ **Educational**: Clear visual examples

### What Each Image Contains
- **Farm Background**: Sky gradient + ground texture
- **Cow Shapes**: Color-coded by behavior type
- **Multiple Animals**: 1-3 animals per image
- **Class Features**: Behavior-specific visual indicators
- **Realistic Positions**: Varied sizes and locations

### Visual Indicators
- 🍽️ **Food bowl** for eating behavior
- 🔴 **Red circle** for distress indicators
- 🔺 **Warning triangle** for fall risks
- 🌸 **Pink coloring** for piglets
- 📏 **Horizontal body** for lying down

## 📈 Performance Expectations

With this synthetic dataset, you can expect:
- **Training Time**: 5-10 minutes (GPU) / 30-60 minutes (CPU)
- **Validation Accuracy**: 85-95% (synthetic data trains well)
- **Inference Speed**: <2ms per image
- **Model Size**: ~50MB (YOLOv8l)

## 🔧 For Better Results

While this synthetic dataset works great for demonstration, for production use consider:

### Option 1: Enhance Synthetic Dataset
```bash
# Generate more images
python3 generate_synthetic_dataset.py
# Edit the script to increase num_train, num_val, num_test
```

### Option 2: Use Real Kaggle Dataset
```bash
# Download real farm footage
python setup_dataset.py
```

### Option 3: Mixed Approach
- Start with synthetic (quick results)
- Fine-tune with real data (better accuracy)
- Combine both datasets (best of both worlds)

## 📝 Annotation Format

Each label file contains:
```
<class_id> <x_center> <y_center> <width> <height>
```

All coordinates are **normalized** (0-1) relative to image dimensions.

### Example Label
```
0 0.345678 0.567890 0.123456 0.098765
```
This means:
- Class 0 (cow_eating)
- Center at (34.6%, 56.8%) of image
- Width 12.3% of image width
- Height 9.9% of image height

## 🎯 Use Cases

### Immediate Applications
1. **Demo & Testing**: Perfect for presentations
2. **Development**: Test the full pipeline
3. **Education**: Learn computer vision concepts
4. **Prototyping**: Build MVP quickly

### Production Readiness
1. **Proof of Concept**: Validate the approach
2. **Model Baseline**: Compare with real data
3. **Integration Testing**: Test the full system
4. **User Training**: Teach farm staff

## 🔄 Regenerating Dataset

Want different variations? Edit the generator:

```python
# In generate_synthetic_dataset.py
stats = generator.generate_dataset(
    num_train=100,  # Increase training images
    num_val=20,     # More validation
    num_test=20     # More test images
)
```

## 📄 License

This synthetic dataset is released under the same license as the project. All images are algorithmically generated and contain no copyrighted material.

## 🤝 Contributing

Want to improve the dataset?
1. Edit `generate_synthetic_dataset.py`
2. Add new behavior classes
3. Improve visual realism
4. Add more annotation features

## 📞 Support

Questions about the dataset?
- Check the `/samples` folder for visual examples
- Review `dataset_stats.json` for statistics
- Run the generator with different parameters

---

**🎉 Ready to push to GitHub! This complete dataset ensures anyone can clone and run your project immediately!**
