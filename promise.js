function Promise(fn) {
    const self = this;
    let status = "pending"; // 存储promise的状态, 设为私有变量
    this.value = ""; //存储promise成功的value
    this.error = ""; // 存储promise失败的报错信息
    this.onFullFilledCb = []; // 存储then方法中注册的回调（一个promise对象可调用多个then）
    this.onRejectedCb = []; // 存储catch方法中注册的回调（then的第二个参数）
    this.getStatus = () => status; // 向外暴露获取status的方法。
    function resolve(value) {
        // 将promise的状态从pending更改为fullfilled，并且以value为参数依次调用then方法中注册的回调
        // 使用setTimeout以确保then方法上注册的回调是异步执行的。
        setTimeout(() => {
            if (status === "pending") {
                status = "fullfilled";
                self.value = value;
                self.onFullFilledCb.forEach(item => item(value));
            }
        },0);
    }
    function reject(error) {
        // 将promise的状态从pending更改为rejected，并且以error为参数依次调用then方法中注册的回调
        setTimeout(() => {
            if (status === "pending") {
                status = "rejected";
                self.error = error;
                self.onRejectedCb.forEach(item => item(error));
            }
        },0);
    }
    try {
        // 保证传入的函数执行出现异常会传给后面的回调
        fn(resolve, reject);
    } catch(e) {
        reject(e);
    }
}
Promise.prototype.then = function(onFullfilled, onRejected) {
    //如果成功和失败的回调没有传，则表示这个then没有任何逻辑，只会把值往后抛
    onFullfilled = typeof onFullfilled === 'function' ? onFullfilled : v => v;
    onRejected = typeof onRejected === 'function' ? onRejected : r => r;
    let promiseNew;
    if (this.getStatus() === 'fullfilled') { // 执行then的时候状态已经是成功，直接执行onFullfilled。
        return promiseNew = new Promise((resolve, reject) => {
            // 保证then方法总是异步执行的
            setTimeout(() => {
                try {
                    let ans = onFullfilled(this.value); // 这个函数有返回值 执行后续逻辑解析promise
                    resolvePromise(promiseNew, ans, resolve, reject);
                }catch(e){
                    // 如果执行失败，则promiseNew reject出错误原因
                    reject(e)
                }
            },0);
        });
    } else if (this.getStatus() === 'rejected') { // 执行then的时候状态已经是失败，直接执行onRejected。
        return promiseNew = new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    let ans = onRejected(this.error); // 这个函数有返回值 执行后续逻辑
                    resolvePromise(promiseNew, ans, resolve, reject);
                }catch(e){
                    reject(e)
                }
            },0);
        });
    }
    return promiseNew = new Promise((resolve, reject) => {
        this.onFullFilledCb.push(() => {
            try {
                let ans = onFullfilled(this.value); // 这个函数有返回值 执行后续逻辑
                resolvePromise(promiseNew, ans, resolve, reject);
            }catch(e){
                reject(e)
            }
        });
        this.onRejectedCb.push(() => {
            try {
                let ans = onRejected(this.error); // 这个函数有返回值 执行后续逻辑
                resolvePromise(promiseNew, ans, resolve, reject);
            }catch(e){
                reject(e)
            }
        });
    });
}

// 处理then方法传入回调的返回值 
function resolvePromise(promiseNew, ans, resolve, reject) {
    if (ans instanceof Promise) {
            ans.then(resolve, reject);
    } else {
        resolve(ans);
    }

};


Promise.prototype.catch = function (onRejected) {
    this.then(null, onRejected);
}

// 高级一点
Promise.all = function(promises){
    return new Promise(function(resolve,reject){
      let done = gen(promises.length,resolve);
      for(let i = 0;i < promises.length; i++){
        promises[i].then(function(data){
          done(i,data);
        },reject);
      }
    });
}
   
function gen(times,cb){
    let result = [],count=0;
    return function(i,data){
        result[i] = data;
        if(++count === times){
            cb(result);
        }
    }
}

// 土一点
Promise.all = function(promises){
    return new Promise(function(resolve,reject){
      let len = promises.length;
      let ans = [];
      let times = 0;
      for(let i = 0;i < len; i++){
        promises[i].then(function(data){
            ans[i] = data;
            if (++times === len) {
                resolve(ans);
            }
        },reject);
      }
    });
}