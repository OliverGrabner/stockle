#!/bin/bash

# STOCKLE GAME HOSTING

sudo docker build -t localhost:32000/stockle-backend:2026-1-15-c .
sudo docker push localhost:32000/stockle-backend:2026-1-15-c

sudo docker build -t localhost:32000/stockle-data-fetcher:2026-1-1-a .
sudo docker push localhost:32000/stockle-data-fetcher:2026-1-1-a
