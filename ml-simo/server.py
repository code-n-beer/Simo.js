from flask import Flask, request, jsonify
app = Flask(__name__)
from transformers import pipeline, PreTrainedModel, GPTNeoForCausalLM
from pprint import pprint
import torch
import shortuuid

torch.zeros(10, 10).to('cuda:0') # early check that GPU works

default_settings = {
  "do_sample":True,
  "min_length":40,
  "max_length":500, 
  "length_penalty":1.0, 
}

#print('starting models')
#generator = pipeline('text-generation', model='EleutherAI/gpt-neo-1.3B', device=0)
#print('model loaded')

if __name__ != '__main__':
   print('not main, starting models')
   generator = pipeline('text-generation', model='EleutherAI/gpt-neo-1.3B', device=0)
   print('model loaded')
#else:
#   print('main, skip models')
#   generator = None


def translate_to_fi(text):
    path = '/translate'
    constructed_url = endpoint + path
    params = {
	'api-version': '3.0',
	'from': 'en',
	'to': ['fi']
    }
    constructed_url = endpoint + path
    headers = {
	'Ocp-Apim-Subscription-Key': subscription_key,
	'Ocp-Apim-Subscription-Region': location,
	'Content-type': 'application/json',
	'X-ClientTraceId': str(uuid.uuid4())
    }
    # You can pass more than one object in body.
    body = [{
	'text': text 
    }]
    request = requests.post(constructed_url, params=params, headers=headers, json=body)
    response = request.json()
    return response[0]['translations'][0]['text']

def write_to_file(input_str):
  uuid = shortuuid.uuid()

  if "<html>" in input_str.lower():
    filename = "%s.html" % uuid
  else:
    filename = "%s.txt" % uuid

  with open('/mlsimo-data/output/' + filename, "w", encoding="utf8") as text_file:
    text_file.write(input_str)
    
  return filename

def gen(prompt, bad_words, settings, translate=False):
  if settings is None:
    settings = default_settings
  if 'max_length' in settings and settings['max_length'] > 20000:
    settings['max_length'] = 20000

  if bad_words and len(bad_words) > 0:
    ebun = generator(prompt, **settings,
      bad_words_ids=generator.tokenizer(bad_words)['input_ids'])
  else:
    ebun = generator(prompt, **settings)

  output = ebun[0]['generated_text']
  if translate:
      output = translate_to_fi(output)
  filename = write_to_file(output)

  return filename, output


print('starting server')

@app.route('/')
def index():
  return 'Server Works!'
  
@app.route('/gpt', methods=['POST'])
def add_message():
  content = request.json
  prompt = content['prompt'].replace("|","\n")
  bad_words = content['bad_words'] if 'bad_words' in content else None
  settings = content['settings'] if 'settings' in content else None
  translate = True if 'translate' in content else False

  filename, output = gen(prompt, bad_words, settings, translate)

  return jsonify({'filename': filename, 'output': output})

#if __name__ == '__main__':
#  app.run(host= '0.0.0.0', port=8000, debug=False, threaded=False, processes=0)
#  print('server started, 0.0.0.0:8000')

  

