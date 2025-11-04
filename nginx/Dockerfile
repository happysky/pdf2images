FROM library/nginx

# Remove sym links from nginx image
#RUN rm /var/log/nginx/access.log
#RUN rm /var/log/nginx/error.log

# 使用 archive 源
RUN sed -i 's|http://deb.debian.org/debian|http://archive.debian.org/debian|g' /etc/apt/sources.list && \
    sed -i 's|http://security.debian.org/debian-security|http://archive.debian.org/debian-security|g' /etc/apt/sources.list

# Install logrotate
RUN apt-get update -o Acquire::Check-Valid-Until=false && \
    apt-get -y install logrotate cron

# Copy MyApp nginx config
#COPY config/nginx.conf /etc/nginx/nginx.conf

#Copy logrotate nginx configuration
#COPY config/logrotate.d/nginx /etc/logrotate.d/

# Start nginx and cron as a service
CMD service cron start && nginx -g 'daemon off;'
