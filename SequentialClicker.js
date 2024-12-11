class SequentialClicker {
    constructor(selectors, delay = 100, timeout = 10_000, repeat = Infinity, callbacks={}) {
        this.selectors = selectors;
        this.delay = delay;
        this.timeout = timeout;
        this.repeat = repeat;

        this.currentIndex = 0;
        this.completedCycles = 0;
        this.isRunning = false;

        this.beforeClick = callbacks.beforeClick || null;
        this.afterClick = callbacks.afterClick || null;
        this.onError = callbacks.onError || null;
        this.onStart = callbacks.onStart || null;
        this.onStop = callbacks.onStop || null;
        this.onLog = callbacks.onLog || null;
    }

    log(message) {
        if (this.onLog) {
            this.onLog(message);
        }
    }

    async waitForElement(selector) {
        return new Promise((resolve, reject) => {
            this.log(`Waiting for element with selector: ${selector}`);
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    this.log(`Element found: ${selector}`);
                    resolve(element);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                this.log(`Element found immediately: ${selector}`);
                resolve(element);
            }

            setTimeout(() => {
                observer.disconnect();
                this.log(`Timeout waiting for selector: ${selector}`);
                reject(new Error("Timeout"));
            }, this.timeout);
        });
    }

    async process() {
        if (!this.isRunning || this.completedCycles >= this.repeat) {
            this.log("Process stopped.");
            if (this.onStop) {
                this.onStop();
            }
            this.isRunnning = false;
            return;
        }

        const selector = this.selectors[this.currentIndex];
        try {
            this.log(`Processing selector: ${selector}`);
            const element = await this.waitForElement(selector);

            if (this.beforeClick) {
                this.log(`Executing beforeClick callback for selector: ${selector}`);
                await this.beforeClick({element, selector});
            }

            this.log(`Clicking element: ${selector}`);
            element.click();
            element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

            if (this.afterClick) {
                this.log(`Executing afterClick callback for selector: ${selector}`);
                await this.afterClick({element, selector});
            }

            await new Promise((resolve) => setTimeout(resolve, this.delay));

            this.currentIndex = (this.currentIndex + 1) % this.selectors.length;
            if (this.currentIndex === 0) {
                this.completedCycles++;
                this.log(`Completed cycle ${this.completedCycles}/${this.repeat}`);
            }

            requestAnimationFrame(() => this.process());
        } catch (error) {
            this.log(`Error encountered: ${error.message}`);
            if (this.onError) {
                this.onError(error, selector);
            }
            this.stop();
        }
    }

    start() {
        if (this.isRunning) return;
        this.completedCycles = 0;
        this.log("Starting SequentialClicker.");
        if (this.onStart) {
            this.onStart();
        }
        this.isRunning = true;
        this.process();
    }

    stop() {
        if (!this.isRunning) return;
        this.log("Stopping SequentialClicker.");
        this.isRunning = false;
        this.currentIndex = 0;
    }
}
