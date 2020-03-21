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
    },
    makeResizable: ({ id, minWidth, maxWidth }) => {
        const resizableElement = document.getElementById(id);

        resizableElement.style.position = 'relative';

        if (minWidth) {
            resizableElement.style.minWidth = minWidth;
        }
        if (maxWidth) {
            resizableElement.style.maxWidth = maxWidth;
        }

        // Add handle
        let resizeBar = document.createElement('div');
        resizeBar.setAttribute('id', id + "_resizeBar")
        resizeBar.setAttribute('class', "resize-bar")
        resizeBar.setAttribute('style', `height: 100%;
        width: 5px;
        position: absolute;
        top: 0;
        right: 0;
        /* background-color: red; */
        cursor: w-resize;`)

        resizableElement.appendChild(resizeBar)

        // Set width if available in localstorage
        let width = localStorage.getItem(id + 'Width');
        if (width) {
            resizableElement.style.width = width + "px"
        }

        function mouseDown() {
            // console.log("Mouse down!!!");

            // Listen for mouseup
            document.addEventListener('mouseup', mouseUp)

            // Listen for mousemove
            document.addEventListener('mousemove', mouseMove)

            // Disable text selection
            document.addEventListener('selectstart', disableSelect);

        }
        resizeBar.addEventListener('mousedown', mouseDown)

        function mouseUp() {
            // console.log("Mouse up");

            // Stop listening to mouseup and mousemove
            document.removeEventListener('mouseup', mouseUp)
            document.removeEventListener('mousemove', mouseMove)

            // Re-enable text selection
            document.removeEventListener('selectstart', disableSelect);

            // Store final width in localStorage
            localStorage.setItem('emailListWidth', width);
            console.log("Saving width for " + id, width);

        }

        // let left = resizableElement.getClientRects()[0].x;
        function mouseMove(event) {
            // console.log("Dragging...", event.x - left);
            width = event.x - resizableElement.getClientRects()[0].x;
            resizableElement.style.width = width + "px";
        }

        function disableSelect(e) {
            e.preventDefault();
        }
    }
}