# docker run --rm 
#            --name njs_example \
#            -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
#            -v $(pwd):/etc/nginx/njs/:ro 
#            -p 80:80 
#            -p 443:443 
#            nginx

FROM nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY http/schedule.js /etc/nginx/http/schedule.js

CMD ["nginx"]
