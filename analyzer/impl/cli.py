import sys

from .analyze import analyze

def run():
  bytes = sys.stdin.buffer.read(50000000)
  result = analyze(bytes)

  print(result)
