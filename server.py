import os
import time
import io
import cv2
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app) 
os.makedirs("uploads", exist_ok=True)

TARGET_W, TARGET_H = 320, 160 
display_version = "v0"
master_canvas = Image.new('RGB', (TARGET_W, TARGET_H), color=(0, 0, 0))

scroll_flag = 0 
scroll_speed = 5
esp_last_seen = 0 

@app.route('/')
def serve_index(): return send_file('index.html')

@app.route('/api/status', methods=['GET'])
def get_status():
    global esp_last_seen
    return jsonify({"online": (time.time() - esp_last_seen) < 15})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: return jsonify({"error": "No file"}), 400
    file = request.files['file']
    filepath = os.path.join("uploads", file.filename)
    file.save(filepath)
    return jsonify({"media": {"id": file.filename, "filePath": filepath}})

@app.route('/publish-final', methods=['POST'])
def publish_final():
    global master_canvas, display_version, scroll_flag, scroll_speed
    data = request.json
    c_type = data.get('type')
    
    scroll_flag = 1 if data.get('scroll') == 'true' else 0
    scroll_speed = int(data.get('speed', 5))
    
    if c_type in ['image', 'gif', 'video']:
        filepath = data.get('file_path')
        scale = float(data.get('scale', 100)) / 100.0
        
        if filepath.endswith('.mp4'):
            vid = cv2.VideoCapture(filepath)
            ret, frame = vid.read()
            if ret: img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            vid.release()
        else:
            img = Image.open(filepath).convert('RGB')
            
        new_w, new_h = int(TARGET_W * scale), int(TARGET_H * scale)
        img = img.resize((new_w, new_h))
        final_img = Image.new('RGB', (TARGET_W, TARGET_H), color=(0,0,0))
        final_img.paste(img, ((TARGET_W - new_w) // 2, (TARGET_H - new_h) // 2))
        master_canvas = final_img.transpose(Image.FLIP_TOP_BOTTOM)
        
    elif c_type == 'text':
        text_color = data.get('text_color', 'white')
        text = data.get('text', '')
        x, y = int(data.get('x', 60)), int(data.get('y', 140))
        scale = int(data.get('scale', 2))
        
        img = Image.new('RGB', (TARGET_W, TARGET_H), color=data.get('bg_color', 'black'))
        draw = ImageDraw.Draw(img)
        
        if data.get('font_style') == '5x7':
            basic_font = ImageFont.load_default()
            bbox = draw.textbbox((0, 0), text, font=basic_font)
            txt_w, txt_h = max(bbox[2]-bbox[0], 1), max(bbox[3]-bbox[1], 1)
            txt_img = Image.new('RGBA', (txt_w + 2, txt_h + 2), (0,0,0,0))
            ImageDraw.Draw(txt_img).text((1, 1), text, fill=text_color, font=basic_font)
            txt_img = txt_img.resize(((txt_w+2)*scale, (txt_h+2)*scale), Image.NEAREST)
            img.paste(txt_img, (x, y), txt_img)
        else:
            try: font = ImageFont.truetype("arial.ttf", size=scale * 10)
            except: font = ImageFont.load_default()
            draw.text((x, y), text, fill=text_color, font=font)
        
        master_canvas = img.transpose(Image.FLIP_TOP_BOTTOM)
        
    display_version = f"v_{int(time.time())}"
    return jsonify({"success": True})

@app.route('/version', methods=['GET'])
def get_version():
    global esp_last_seen
    esp_last_seen = time.time() 
    return display_version

@app.route('/get_screen', methods=['GET'])
def get_screen():
    pixels = master_canvas.load()
    byte_array = bytearray()
    byte_array.extend([0xAA, scroll_flag, scroll_speed, 0x01, 0x00])
    for y in range(TARGET_H):
        for x in range(TARGET_W):
            r, g, b = pixels[x, y]
            packed = (int(r/255*15) << 8) | (int(g/255*15) << 4) | int(b/255*15)
            byte_array.append(packed >> 8)
            byte_array.append(packed & 0xFF)
    return send_file(io.BytesIO(byte_array), mimetype='application/octet-stream')

@app.route('/logout-log', methods=['POST'])
def mock_logs(): return jsonify({"success": True})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)