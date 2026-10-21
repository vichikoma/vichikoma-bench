#!/usr/bin/env python
"""qa.py —— 对任意 wav 做数值质检（不靠耳朵）。

    python scripts/qa.py piece.wav
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import musiclib as mg  # noqa: E402

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("用法: python scripts/qa.py <wav>")
    mg.qa(sys.argv[1])
