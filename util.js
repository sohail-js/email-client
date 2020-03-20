const utility = {
    debounce: function (fn, delay) {
        let timeout;
        return function () {
            clearTimeout(timeout);
            let context = this, args = arguments;
            timeout = setTimeout(() => {
                fn.call(context, ...args);
            }, delay)
        }
    },
    throttle: function (fn, delay) {
        let isBusy = false;
        return function () {
            if (!isBusy) {
                fn.call(this, ...arguments);
                isBusy = true;
                setTimeout(() => {
                    isBusy = false;
                }, delay);
            }
        }
    },
    arrayToHashmap: function (arr) {
        let obj = {};
        arr.forEach(item => {
            obj[item] = true;
        })

        return obj;
    },
    http: ({ url, method }) => {
        return fetch(url, {
            method: method,
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'QM8VTHrLR2JloKTJMZ3N6Qa93FVsx8LapKCzEjui'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
        })
            .then(res => res.json())
    }
}