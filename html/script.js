document.addEventListener("DOMContentLoaded", (event) => {
    var ProgressBar = {
        init: function () {
            this.progressLabel = document.getElementById("progress-label");
            this.progressNumber = document.querySelector("#progress-percentage .number");
            this.hexagonContainer = document.getElementById("hexagon-container");
            this.progressContainer = document.querySelector(".progress-container");
            this.animationFrameRequest = null;
            this.totalSegments = 13;
            this.createHexagons();
            this.setupListeners();
        },

        createHexagons: function() {
            for (let i = 0; i < this.totalSegments; i++) {
                const hexagon = document.createElement('div');
                hexagon.className = 'hexagon';
                this.hexagonContainer.appendChild(hexagon);
            }
            this.hexagons = Array.from(this.hexagonContainer.getElementsByClassName('hexagon'));
        },

        setupListeners: function () {
            window.addEventListener("message", function (event) {
                if (event.data.action === "progress") {
                    ProgressBar.update(event.data);
                } else if (event.data.action === "cancel") {
                    ProgressBar.cancel();
                }
            });
        },

        update: function (data) {
            if (this.animationFrameRequest) {
                cancelAnimationFrame(this.animationFrameRequest);
            }
            clearTimeout(this.cancelledTimer);

            this.progressLabel.textContent = data.label;
            this.progressNumber.textContent = "0";
            this.progressContainer.style.display = "block";
            
            this.hexagons.forEach(hex => {
                hex.classList.remove('active', 'fading');
                hex.style.opacity = '0';
            });

            this.hexagons.forEach((hex, index) => {
                setTimeout(() => {
                    hex.classList.add('fading');
                }, index * 100);
            });
            
            let startTime = Date.now();
            let duration = parseInt(data.duration, 10);

            const animateProgress = () => {
                let timeElapsed = Date.now() - startTime;
                let progress = timeElapsed / duration;
                if (progress > 1) progress = 1;
                
                let percentage = Math.round(progress * 100);
                this.progressNumber.textContent = percentage;
                
                const activeHexagons = Math.floor(progress * this.totalSegments);
                this.hexagons.forEach((hex, index) => {
                    if (index < activeHexagons) {
                        hex.classList.add('active');
                    } else {
                        hex.classList.remove('active');
                    }
                });

                if (progress < 1) {
                    this.animationFrameRequest = requestAnimationFrame(animateProgress);
                } else {
                    this.onComplete();
                }
            };
            this.animationFrameRequest = requestAnimationFrame(animateProgress);
        },

        cancel: function () {
            if (this.animationFrameRequest) {
                cancelAnimationFrame(this.animationFrameRequest);
                this.animationFrameRequest = null;
            }
            this.progressLabel.textContent = "CANCELLED";
            this.progressNumber.textContent = "";
            document.getElementById("progress-percentage").classList.add("canceled");
            this.hexagons.forEach(hex => {
                hex.classList.remove('active');
                hex.classList.add('canceled');
            });
            this.cancelledTimer = setTimeout(this.onCancel.bind(this), 1000);
        },

        onComplete: function () {
            this.progressContainer.style.display = "none";
            this.hexagons.forEach(hex => hex.classList.remove('active'));
            this.progressNumber.textContent = "";
            this.postAction("FinishAction");
        },

        onCancel: function () {
            this.progressContainer.style.display = "none";
            document.getElementById("progress-percentage").classList.remove("canceled");
            this.hexagons.forEach(hex => {
                hex.classList.remove('active', 'canceled');
            });
        },

        postAction: function (action) {
            fetch(`https://progressbar/${action}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            });
        },

        closeUI: function () {
            let mainContainer = document.querySelector(".main-container");
            if (mainContainer) {
                mainContainer.style.display = "none";
            }
        },
    };

    ProgressBar.init();
});
