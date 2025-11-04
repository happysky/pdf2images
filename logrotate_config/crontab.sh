#!/bin/sh

echo "[`date "+%Y/%m/%d %H:%M:%S"`] logrotate-start"
test -x /usr/sbin/logrotate && /usr/sbin/logrotate /etc/logrotate.conf
echo "[`date "+%Y/%m/%d %H:%M:%S"`] logrotate-end"