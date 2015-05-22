#!/bin/sh

SERVICE_NAME=leader-board

SCRIPTDIR=$(cd $(dirname $0) && pwd)
HOSTNAME=`hostname`
PID=`pidof node | xargs -I % ps -p % -o pid,cmd --no-heading | grep $SERVICE_NAME | awk '{ print $1 }' 2>/dev/null`
export PATH="$PATH:$SCRIPTDIR../node_modules/.bin"

validation() {

    if [ -z $(which node) ]; then
      echo "Cannot find node in path"
      exit 1
    fi

    if [ -z $(which mongod) ]; then
      echo "Cannot find mongod in path"
      exit 1
    fi

    if [ -f $SCRIPTDIR/../config.sh ]; then
      . $SCRIPTDIR/../config.sh
    else
      echo "Config file Missing: $SCRIPTDIR/../config.sh"
      exit 1
    fi

}

start() {
    validation

    if ps -p $PID > /dev/null  2>&1
    then
      echo "$SERVICE_NAME already running"
    else
      mkdir node_modules > /dev/null  2>&1
      cd $SCRIPTDIR/../
      npm install
      nohup $SCRIPTDIR/www > $SCRIPTDIR/../$SERVICE_NAME.log 2>&1 &
      PID=$!
      echo "$SERVICE_NAME started at $PID on port $HTTP_PORT"
    fi
}

stop() {
  if [ $? -eq 0 ]; then
    kill $PID > /dev/null  2>&1
    if [ $? -eq 1 ]; then
      echo "No $SERVICE_NAME process to stop"
    else
      echo "Shutting down $SERVICE_NAME $PID"
    fi
  fi
}

status() {
  if [ $? -eq 0 ]; then
    if ps -p $PID > /dev/null 2>&1
    then
      echo "$SERVICE_NAME is running on $HOSTNAME, process $PID"
    else
      echo "$SERVICE_NAME is not running"
    fi
  fi
}

update() {
    stop
    cd $SCRIPTDIR/../../
    wget 'http://build.nas2.i-edo.net:8080/view/BI%20Solutions/job/bi-leader-board/lastSuccessfulBuild/artifact/bi-leader-board.tar.gz' -O bi-leader-board.tar.gz
    mkdir -p ./bi-leader-board
    tar -zxvf bi-leader-board.tar.gz -C ./bi-leader-board
    rm bi-leader-board.tar.gz
    cd ./bi-leader-board
    ./bin/leader-board.sh start
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    status
    ;;
  update)
    update
    ;;
  restart)
    stop
    sleep 3s && start
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart|update}"
    exit 1
esac
