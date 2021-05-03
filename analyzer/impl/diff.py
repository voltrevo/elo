from .helpers.unexpected import Unexpected
from dataclasses import dataclass
from typing import List, Union

# These define the structure of the history, and correspond to diff output with
# lines that start with a space, a + and a - respectively.

@dataclass
class Keep:
  text: str

@dataclass
class Insert:
  text: str

@dataclass
class Remove:
  text: str

Action = Union[Keep, Insert, Remove, Unexpected]

@dataclass
class Frontier:
  x: int
  history: List[Action]

def diff(before: str, after: str) -> List[Action]:
    """
    An implementation of the Myers diff algorithm.
    See http://www.xmailserver.org/diff2.pdf
    """
    # This marks the farthest-right point along each diagonal in the edit
    # graph, along with the history that got it there
    frontier = {1: Frontier(0, [])}

    def one(idx: int) -> int:
        """
        The algorithm Myers presents is 1-indexed; since Python isn't, we
        need a conversion.
        """
        return idx - 1

    before_max = len(before)
    after_max = len(after)
    for d in range(0, before_max + after_max + 1):
        for k in range(-d, d + 1, 2):
            # This determines whether our next search point will be going down
            # in the edit graph, or to the right.
            #
            # The intuition for this is that we should go down if we're on the
            # left edge (k == -d) to make sure that the left edge is fully
            # explored.
            #
            # If we aren't on the top (k != d), then only go down if going down
            # would take us to territory that hasn't sufficiently been explored
            # yet.
            go_down = (k == -d or 
                    (k != d and frontier[k - 1].x < frontier[k + 1].x))

            # Figure out the starting point of this iteration. The diagonal
            # offsets come from the geometry of the edit grid - if you're going
            # down, your diagonal is lower, and if you're going right, your
            # diagonal is higher.
            if go_down:
                old_x = frontier[k + 1].x
                history = frontier[k + 1].history
                x = old_x
            else:
                old_x = frontier[k - 1].x
                history = frontier[k - 1].history
                x = old_x + 1

            # We want to avoid modifying the old history, since some other step
            # may decide to use it.
            history = history[:]
            y = x - k

            # We start at the invalid point (0, 0) - we should only start building
            # up history when we move off of it.
            if 1 <= y <= after_max and go_down:
                history.append(Insert(after[one(y)]))
            elif 1 <= x <= before_max:
                history.append(Remove(before[one(x)]))

            # Chew up as many diagonal moves as we can - these correspond to common lines,
            # and they're considered "free" by the algorithm because we want to maximize
            # the number of these in the output.
            while x < before_max and y < after_max and before[one(x + 1)] == after[one(y + 1)]:
                x += 1
                y += 1
                history.append(Keep(before[one(x)]))

            if x >= before_max and y >= after_max:
                # If we're here, then we've traversed through the bottom-left corner,
                # and are done.
                return history
            else:
                frontier[k] = Frontier(x, history)

    assert False, 'Could not find edit script'
