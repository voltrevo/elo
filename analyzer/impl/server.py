import dataclasses
from http.server import BaseHTTPRequestHandler, HTTPServer
import json

from .analyze import analyze

hostName = "localhost"
serverPort = 28329

class MyServer(BaseHTTPRequestHandler):
  def do_POST(self):
    request_bytes = self.rfile.read(int(self.headers['Content-Length']))
    result = analyze(request_bytes, self.headers['x-target-transcript'])
    result_json = json.dumps(dataclasses.asdict(result))

    self.send_response(200)
    self.send_header("Content-type", "application/json")
    self.end_headers()

    self.wfile.write(bytes(result_json, "utf-8"))

def run():
  webServer = HTTPServer((hostName, serverPort), MyServer)
  print("Server started http://%s:%s" % (hostName, serverPort))

  try:
      webServer.serve_forever()
  except KeyboardInterrupt:
      pass

  webServer.server_close()
  print("Server stopped.")
