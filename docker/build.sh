#steps 
#exit if any docker build fails. We dont go to the next docker builds  -e
#If any variable is not passed immediately close the pipeline -u 
#if anycommand fails the whole fine fails-o pipeline 


set -euo pipefail

cd "$(dirname "$0")/.."
#debug 1
echo "Building Python runner..."
docker build -f docker/python.Dockerfile -t leetcode-runner-python:latest .
#debug 2
echo "Building Node runner..."
docker build -f docker/node.Dockerfile -t leetcode-runner-node:latest .
#debug 3
echo "Building Java runner..."
docker build -f docker/java.Dockerfile -t leetcode-runner-java:latest .
#final debug exho 
echo ""
echo "Done. Images:"
docker images | grep leetcode-runner