import os
import time
import pymupdf
import hashlib
import zipfile

from io import BytesIO
from flask import Flask, request, redirect, abort, jsonify, send_file, render_template

app = Flask(__name__, static_url_path='', static_folder='static')
import logging.config

logging.config.dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "simple": {"format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"}
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": "DEBUG",
                "formatter": "simple",
                "stream": "ext://sys.stdout",
            },
            "info_file_handler": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "INFO",
                "formatter": "simple",
                "filename": "logs/info.log",
                "maxBytes": 10485760,
                "backupCount": 50,
                "encoding": "utf8",
            },
            "error_file_handler": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "simple",
                "filename": "logs/errors.log",
                "maxBytes": 10485760,
                "backupCount": 20,
                "encoding": "utf8",
            },
            "debug_file_handler": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "DEBUG",
                "formatter": "simple",
                "filename": "logs/debug.log",
                "maxBytes": 10485760,
                "backupCount": 50,
                "encoding": "utf8",
            },
        },
        "loggers": {
            "my_module": {"level": "ERROR", "handlers": ["console"], "propagate": "no"}
        },
        "root": {
            "level": "DEBUG",
            "handlers": ["error_file_handler", "debug_file_handler"],
        },
    }
)
cwd=os.getcwd()

def current_milli_time():
    return round(time.time() * 1000)

def isNum(value):
  if not isinstance(value, str):
    if isinstance(value, float):
      return True
    elif isinstance(value, int):
      return True
    else:
      return False
  s=value.split('.')
  if len(s)==1:
    return value.isdigit()
  elif len(s)==2:
    for si in s:
      if not si.isdigit():
        return False
    return True
  else:
    return False

def toNum(value):
  if not isNum(value):
    return ''
  if not isinstance(value, str):
    return value
  if(len(value.strip()) == 0):
    return ''
  s=value.split('.')
  if len(s)==1:
    return int(value)
  elif len(s)==2:
    for si in s:
      if not si.isdigit():
        return ''
    return float(value)
  else:
    return ''

@app.route('/')
def index():
    return render_template('index.html', current_time=int(time.time()))

@app.route('/convert', methods = ['GET', 'POST'])
def convert():
    if request.method == 'POST':
      start_time = current_milli_time()
      file = request.files['file']
      pdf_bytes = file.read()
      doc = pymupdf.open("pdf", pdf_bytes) # open a document
      page_number = toNum(request.form.get("page_number"))
      page_number_pdf = -1
      if isinstance(page_number, int) and page_number <= doc.page_count:
        page_number_pdf = page_number
      # doc = fitz.open(None, mem_area, "pdf")
      # file_name = "2404.07143v1.pdf"
      #doc = pymupdf.open(file_name) # open a document
      # with open(file_name, 'rb') as fp:
      #   data = fp.read()
      # file_md5= hashlib.md5(data).hexdigest()
      file_md5= hashlib.md5(pdf_bytes).hexdigest()
      text = ""
      file_path = '%s/static/pdfs/%s' % (cwd, file_md5)
      isExists=os.path.exists(file_path)
      if not isExists:
          os.makedirs(file_path)
      
      if page_number_pdf >= 0:
        page = doc[page_number_pdf-1]
        pix = page.get_pixmap(
          matrix = pymupdf.Matrix(2, 2)
        )  # render page to an image
        pix.save("%s/%i.jpeg" % (file_path, page_number_pdf))  # store image as a PNG

      else:
        for page in doc:  # iterate through the pages
          text += page.get_text()
          pix = page.get_pixmap(
            matrix = pymupdf.Matrix(2, 2)
          )  # render page to an image
          #pix.save("%s/page-%i.png" % (file_path,page.number))  # store image as a PNG
          pix.save("%s/%i.jpeg" % (file_path, page.number+1))  # store image as a PNG
      
      end_time = current_milli_time()
      used_time = end_time - start_time
      result = {
        'md5':file_md5,
        'page_count': doc.page_count,
        'file_path': file_path,
        'used_time': used_time,
        'page_number': page_number_pdf
      }
      return jsonify(error=0, data=result), 200
        # print("a1")
        # if 'file' not in request.files:
        #     print(request.files)
        #     return redirect('/')
        # file = request.files['file']
        # if file.filename == '':
        #     return abort(400)
        # if file:

        #     doc = fitz.open("./2404.07143v1.pdf")
        #     text = ""
        #     for page in doc:  # iterate through the pages
        #       print("x3")
        #       text += page.getText()
        #       pix = page.get_pixmap()  # render page to an image
        #       pix.save("/app/page-%i.png" % page.number)  # store image as a PNG
        #     return jsonify(message=text), 200

        #     # with file.stream as stream:
        #     #     doc = Document(stream)
        #     #     # doc = fitz.open(stream=stream, filetype="pdf")
        #     #     print("x2")
        #     #     text = ""
        #     #     for page in doc:  # iterate through the pages
        #     #       print("x3")
        #     #       text += page.getText()
        #     #       pix = page.get_pixmap()  # render page to an image
        #     #       pix.save("/app/page-%i.png" % page.number)  # store image as a PNG
        #     # return jsonify(message=text), 200
        # else:
        #     return abort(500)
    else:
        return abort(404)

if __name__=='__main__':
    app.run(host="0.0.0.0", port=5001)