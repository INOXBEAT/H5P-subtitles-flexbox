window.onload = function () {
    const h5pContent = document.querySelector('.h5p-iframe-wrapper iframe');

    if (h5pContent) {
        const interval = setInterval(function () {
            let h5pDocument;

            try {
                h5pDocument = h5pContent.contentDocument || h5pContent.contentWindow.document;
            } catch (error) {
                console.error('Error accediendo al contenido del iframe:', error.message);
                return;
            }

            if (h5pDocument && h5pDocument.readyState === 'complete') {
                clearInterval(interval);

                const link = h5pDocument.createElement('link');
                link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css";
                link.rel = "stylesheet";
                link.crossOrigin = "anonymous";
                h5pDocument.head.appendChild(link);

                const isInteractiveVideo = h5pDocument.querySelector('.h5p-video-wrapper');
                const isCoursePresentation = h5pDocument.querySelector('.h5p-slide');

                if (isInteractiveVideo) {
                    console.log('Recurso identificado: Interactive Video');
                    initializeInteractiveVideo(h5pDocument);
                }

                if (isCoursePresentation) {
                    console.log('Recurso identificado: Course Presentation');
                    initializeCoursePresentation(h5pDocument);
                }

                setTimeout(() => {
                    adjustHeights(h5pDocument);
                }, 500);

                h5pContent.contentWindow.addEventListener('resize', () => adjustHeights(h5pDocument));
                h5pContent.contentWindow.addEventListener('load', () => adjustHeights(h5pDocument));
                h5pContent.contentWindow.addEventListener('DOMContentLoaded', () => adjustHeights(h5pDocument));

                observeContentChanges(h5pDocument);
            }
        }, 500);
    }
};

function adjustHeights(h5pDocument) {
    const colH5P = h5pDocument.getElementById('col-h5p');
    const colText = h5pDocument.getElementById('captions-container-iv');

    if (colH5P && colText) {
        const h5pHeight = colH5P.offsetHeight;
        const textHeight = colText.offsetHeight;

        if (h5pHeight !== textHeight) {
            const maxHeight = Math.max(h5pHeight, textHeight);

            colH5P.style.height = `${maxHeight}px`;
            colText.style.height = `${maxHeight}px`;

            console.log('Alturas ajustadas:', maxHeight);
        }
    }
}

function initializeInteractiveVideo(h5pDocument) {
    const h5pContainer = h5pDocument.querySelector('.h5p-content');
    if (!h5pContainer) return;

    const trackElements = h5pDocument.querySelectorAll('track');
    if (trackElements.length === 0) {
        console.log('No se encontró ninguna etiqueta <track> en el contenido H5P.');
        return;
    }

    const container = setupContainerLayout(h5pDocument, h5pContainer, 'captions-container-iv');

    trackElements.forEach(track => {
        const trackSrc = track.getAttribute('src');
        if (trackSrc) {
            fetch(trackSrc)
                .then(response => response.text())
                .then(vttData => {
                    const captions = processVTT(vttData);
                    setupCaptions(h5pDocument, captions, container, 'iv');

                    const videoElement = h5pDocument.querySelector('video');
                    if (videoElement) {
                        syncSubtitlesWithScroll(videoElement, captions, h5pDocument, 'iv');
                    }

                    addCustomSubtitleOption(h5pDocument);
                })
                .catch(error => console.error('Error al procesar el archivo .vtt:', error.message));
        }
    });
}

function initializeCoursePresentation(h5pDocument) {
    const slides = h5pDocument.querySelectorAll('.h5p-slide');
    if (slides.length === 0) return;

    let currentVideo = null;
    let syncEventHandler = null;

    const handleSlideChange = () => {
        const currentSlide = h5pDocument.querySelector('.h5p-current');

        if (currentSlide) {
            const slideIndex = Array.from(slides).indexOf(currentSlide);
            console.log(`--- Diapositiva actual: ${slideIndex + 1} ---`);

            if (currentVideo && syncEventHandler) {
                currentVideo.removeEventListener('timeupdate', syncEventHandler);
                syncEventHandler = null;
            }

            const videoElement = currentSlide.querySelector('video');
            const trackElement = videoElement ? videoElement.querySelector('track') : null;

            if (videoElement && trackElement) {
                console.log(`Diapositiva ${slideIndex + 1}: El video tiene subtítulos.`);

                const vttSrc = trackElement.getAttribute('src');
                if (vttSrc) {
                    fetch(vttSrc)
                        .then(response => response.text())
                        .then(vttData => {
                            const captions = processVTT(vttData);
                            const container = createFlexLayout(h5pDocument, currentSlide, videoElement, captions, slideIndex);

                            currentSlide.innerHTML = '';  // Clear current slide content
                            currentSlide.appendChild(container);

                            syncEventHandler = () => syncSubtitlesWithScroll(videoElement, captions, h5pDocument, 'slide', slideIndex);
                            videoElement.addEventListener('timeupdate', syncEventHandler);
                            currentVideo = videoElement;
                        })
                        .catch(error => console.error(`Error al obtener el archivo VTT: ${error.message}`));
                }
            } else {
                console.log(`Diapositiva ${slideIndex + 1}: El video no tiene subtítulos o no es un video.`);
            }
        }
    };

    const observer = new MutationObserver(handleSlideChange);
    slides.forEach(slide => {
        observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
    });

    handleSlideChange();
}

function setupContainerLayout(h5pDocument, h5pContainer, captionsContainerId) {
    const container = h5pDocument.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'row'; // Cambiado a flexbox
    container.style.maxHeight = '100vh';
    h5pDocument.body.appendChild(container);

    const colH5P = h5pDocument.createElement('div');
    colH5P.style.flex = '1 1 70%'; // Ajustar el tamaño según necesites
    colH5P.appendChild(h5pContainer);
    container.appendChild(colH5P);

    const colText = h5pDocument.createElement('div');
    colText.id = captionsContainerId;
    colText.style.flex = '1 1 30%'; // Ajustar el tamaño según necesites
    colText.style.overflowY = 'auto';
    container.appendChild(colText);

    return colText;
}

function addCustomSubtitleOption(h5pDocument) {
    const captionsControl = h5pDocument.querySelector('.h5p-control.h5p-captions');
    if (!captionsControl) {
        console.log('No se encontró el control de subtítulos.');
        return;
    }

    const captionsMenu = h5pDocument.querySelector('.h5p-chooser.h5p-captions ol');
    if (!captionsMenu) {
        console.log('No se encontró el menú de subtítulos.');
        return;
    }

    const customOption = h5pDocument.createElement('li');
    customOption.textContent = 'Transcripción';
    customOption.style.cursor = 'pointer';

    customOption.addEventListener('click', () => {
        const colText = h5pDocument.getElementById('captions-container-iv');
        const colH5P = h5pDocument.getElementById('col-h5p');

        if (colText.style.display === 'none' || colText.style.display === '') {
            colText.style.display = 'block'; // Mostrar subtítulos
            colH5P.style.flex = '0 0 calc(100% - 300px)'; // Ajustar ancho de video
        } else {
            colText.style.display = 'none'; // Ocultar subtítulos
            colH5P.style.flex = '1'; // Columna de video a 100%
        }
    });

    captionsMenu.appendChild(customOption);
}

function setupCaptions(h5pDocument, captions, colText, type) {
    colText.innerHTML = '';

    const style = h5pDocument.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        .transcription-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .transcription-item:hover {
            background-color: #f0f0f0;
        }

        .left-column {
            flex: 1;
            text-align: center;
        }

        .timestamp-button {
            background: none;
            border: none;
            color: #0078d4;
            cursor: pointer;
            text-decoration: underline;
        }

        .timestamp-button:hover {
            color: #0056b3;
        }
    `;
    h5pDocument.head.appendChild(style);

    captions.forEach((caption, index) => {
        const item = h5pDocument.createElement('div');
        item.className = 'transcription-item';
        item.style.width = '100%';

        const timestampButton = h5pDocument.createElement('button');
        timestampButton.className = 'timestamp-button';
        timestampButton.innerHTML = caption.start;
        timestampButton.onclick = () => {
            const videoElement = h5pDocument.querySelector('video');
            if (videoElement) {
                videoElement.currentTime = caption.startTime;
            }
        };

        const textColumn = h5pDocument.createElement('div');
        textColumn.className = 'left-column';
        textColumn.innerText = caption.text;

        item.appendChild(timestampButton);
        item.appendChild(textColumn);
        colText.appendChild(item);
    });
}

function syncSubtitlesWithScroll(videoElement, captions, h5pDocument, type, slideIndex) {
    const currentTime = videoElement.currentTime;

    captions.forEach(caption => {
        if (currentTime >= caption.startTime && currentTime <= caption.endTime) {
            highlightCaption(caption.text, h5pDocument, type, slideIndex);
        }
    });
}

function highlightCaption(text, h5pDocument, type, slideIndex) {
    const transcriptionItems = h5pDocument.querySelectorAll('.transcription-item');
    transcriptionItems.forEach(item => {
        item.style.fontWeight = 'normal'; // Reset estilo
        if (item.innerText === text) {
            item.style.fontWeight = 'bold'; // Resaltar
        }
    });
}

function processVTT(vttData) {
    const captions = [];
    const lines = vttData.split('\n');
    let currentCaption = null;

    lines.forEach(line => {
        const timeMatch = line.match(/(\d+:\d{2}:\d{2}\.\d{3}) --> (\d+:\d{2}:\d{2}\.\d{3})/);
        if (timeMatch) {
            if (currentCaption) {
                captions.push(currentCaption);
            }
            currentCaption = {
                start: timeMatch[1],
                startTime: convertVTTTimeToSeconds(timeMatch[1]),
                endTime: convertVTTTimeToSeconds(timeMatch[2]),
                text: ''
            };
        } else if (currentCaption) {
            currentCaption.text += line + ' ';
        }
    });

    if (currentCaption) {
        captions.push(currentCaption);
    }

    return captions;
}

function convertVTTTimeToSeconds(time) {
    const parts = time.split(':');
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
}
