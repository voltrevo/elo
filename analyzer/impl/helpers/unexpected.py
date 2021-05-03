class Unexpected:
  def __init__(self) -> None:
      raise RuntimeError('Never construct Unexpected')

def unexpected(value: Unexpected):
  raise TypeError('Unexpected', value)
