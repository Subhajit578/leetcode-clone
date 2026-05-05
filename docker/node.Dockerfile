#numpy depends on glibC which debian -based systems 
#use but alpine uses .musl which is incompatible to glibc. 
#So the py was built on Debian and node and java which does not depend on any 
#pre compiled C extension so I yse Alpine
FROM node:20-alpine

USER node
WORKDIR /sandbox