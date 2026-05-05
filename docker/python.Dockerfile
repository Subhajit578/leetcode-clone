#base image
# create a new user 
# add a home directory for the programs to execute
# sheel access tp bash 
# assign a user id a user id. Linux defaults  1000 to the first user during setup same thing 
# give it a username 
# steps 2-5 are just like making a new pc or seting up a new machine
# then install python just like how we setup python in a new machine 
# set the user to runner before this we were runninf as the root user 
# after this every command runs in runner's sub machine
# set the working directtory as /sandbox 
FROM python:3.11-slim

RUN useradd --create-home --shell /bin/bash --uid 1000 runner

RUN pip install --no-cache-dir \
        numpy==1.26.4 \
        sortedcontainers==2.4.0

USER runner 
WORKDIR /sandbox