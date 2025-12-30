#!/bin/bash

# STOCKLE GAME HOSTING

sudo docker build -t localhost:32000/stockle-backend:2025-12-28-a .
sudo docker push localhost:32000/stockle-backend:2025-12-28-a

sudo docker build -t localhost:32000/stockle-data-fetcher:2025-12-28-a .
sudo docker push localhost:32000/stockle-data-fetcher:2025-12-28-a