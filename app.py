from flask import Flask, render_template, request, jsonify
import torch
from PIL import Image
from io import BytesIO
import os

from Model import TRCaptionNet, clip_transform

app = Flask(__name__)

# Model yükleme
model_ckpt = "./checkpoints/TRCaptionNet_L14_berturk.pth"

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
# device = "cpu"

preprocess = clip_transform(224)
model = TRCaptionNet({
    "max_length": 35,
    "clip": "ViT-L/14",
    "bert": "dbmdz/bert-base-turkish-cased",
    "proj": True,
    "proj_num_head": 16
})
model.load_state_dict(torch.load(model_ckpt, map_location=device)["model"], strict=True)
model = model.to(device)
model.eval()

# Ana sayfa
@app.route('/')
def index():
    return render_template("index.html")

# Caption üretme endpoint'i
@app.route('/generate_caption', methods=['POST'])
def generate_caption():
    file = request.files['image']
    min_len = int(request.form.get("min_length", 11))
    rep_penalty = float(request.form.get("repetition_penalty", 1.6))

    image = Image.open(file).convert("RGB")
    batch = preprocess(image).unsqueeze(0).to(device)

    caption = model.generate(batch, min_length=min_len, repetition_penalty=rep_penalty)[0]
    return jsonify({"caption": caption})

if __name__ == '__main__':
    app.run(debug=True)