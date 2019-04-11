# coding: utf-8
from flask import Flask, render_template, jsonify, request
from nazoru import get_default_graph_path
from nazoru.core import NazoruPredictor
import config

app = Flask(__name__)

@app.route('/')
def home():
  return render_template('index.html', config=config)

@app.route('/predict', methods=['POST'])
def predict():
  data = request.json
  data = [(d['key'], d['time']) for d in data]
  graph = get_default_graph_path()
  predictor = NazoruPredictor(graph)
  try:
    result = predictor.predict_top_n(data, 5)
    result = {
      'result': [{
          'character': row[0],
          'probability': float(row[2]),
      } for row in result],
      'status': 'ok',
    }
    return jsonify(result)
  except IndexError:
    return jsonify({'status': 'ng'})

if __name__ == '__main__':
  app.run(host='127.0.0.1', port=8080, debug=False)
