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
    container.style.flexDirection = 'row';
    container.style.maxHeight = '100vh';
    h5pDocument.body.appendChild(container);

    const colH5P = h5pDocument.createElement('div');
    colH5P.style.flex = '1 1 70%';
    colH5P.id = 'col-h5p';
    colH5P.style.maxHeight = '100%';
    colH5P.appendChild(h5pContainer);
    container.appendChild(colH5P);

    const colText = h5pDocument.createElement('div');
    colText.id = captionsContainerId;
    colText.style.flex = '1 1 30%'; 
    colText.style.display = 'flex';  
    colText.style.flexDirection = 'column';
    colText.style.maxHeight = '100vh';

    const captionsContainer = h5pDocument.createElement('div');
    captionsContainer.id = 'captions-content';
    captionsContainer.style.flexGrow = '1';
    captionsContainer.style.overflowY = 'auto';
    captionsContainer.style.padding = '10px';

    colText.appendChild(captionsContainer);
    container.appendChild(colText);

    return captionsContainer;
}

function createFlexLayout(h5pDocument, slide, videoElement, captions, slideIndex) {
    const container = h5pDocument.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.height = '100vh';

    const colVideo = h5pDocument.createElement('div');
    colVideo.style.flex = '1 1 70%';
    colVideo.style.display = 'flex';
    colVideo.style.alignItems = 'center';
    colVideo.style.justifyContent = 'center';
    colVideo.style.overflow = 'hidden';
    videoElement.style.height = 'auto';
    videoElement.style.maxHeight = '100%';
    videoElement.controls = true;
    colVideo.appendChild(videoElement);
    container.appendChild(colVideo);

    const colText = h5pDocument.createElement('div');
    colText.id = `captions-container-slide-${slideIndex}`;
    colText.style.flex = '1 1 30%';
    colText.style.overflowY = 'auto';
    container.appendChild(colText);

    captions.forEach((caption, index) => {
        const listItem = h5pDocument.createElement('div');
        listItem.classList.add('transcription-item');
        listItem.setAttribute('role', 'listitem');
        listItem.id = `caption-slide-${slideIndex}-${index}`;

        const leftColumn = h5pDocument.createElement('div');
        leftColumn.classList.add('left-column');
        const timeButton = h5pDocument.createElement('button');
        timeButton.classList.add('timestamp-button');
        timeButton.textContent = formatTime(caption.start);
        timeButton.onclick = () => {
            videoElement.currentTime = caption.start;
            videoElement.play();
        };
        leftColumn.appendChild(timeButton);

        const rightColumn = h5pDocument.createElement('div');
        rightColumn.classList.add('right-column');
        rightColumn.textContent = caption.text.trim();

        rightColumn.onclick = () => {
            videoElement.currentTime = caption.start;
            videoElement.play();
        };

        listItem.appendChild(leftColumn);
        listItem.appendChild(rightColumn);
        colText.appendChild(listItem);
    });

    return container;
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

    // Crear una nueva opción en el menú de subtítulos
    const customOption = h5pDocument.createElement('li');
    customOption.textContent = 'Transcripción';
    customOption.style.marginLeft = '8px';
    customOption.style.alignItems = 'center';
    customOption.setAttribute('tabindex', '0');
    customOption.setAttribute('aria-checked', 'false');
    customOption.style.cursor = 'pointer';

    // Añadir evento al hacer clic en la nueva opción
    customOption.addEventListener('click', () => {
        const colText = h5pDocument.getElementById('captions-container-iv');
        const colH5P = h5pDocument.getElementById('col-h5p');

        if (colText.classList.contains('d-none')) {
            // Mostrar subtítulos y reducir la columna de video
            colText.classList.remove('d-none');
            colH5P.classList.remove('col-sm-12');
            colH5P.classList.add('col-sm-8');
            customOption.setAttribute('aria-checked', 'true');
        } else {
            // Ocultar subtítulos y ampliar la columna de video
            colText.classList.add('d-none');
            colH5P.classList.remove('col-sm-8');
            colH5P.classList.add('col-sm-12');
            customOption.setAttribute('aria-checked', 'false');
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
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
        }

        .right-column {
            flex: 5;
            font-size: 14px;
            color: #333;
            padding-left: 8px; 
            text-align: justify;
        }

        .highlighted {
            background-color: #cae4e8;
            font-weight: bold;
        }
    `;
    h5pDocument.head.appendChild(style);

    captions.forEach((caption, index) => {

        const listItem = h5pDocument.createElement('div');
        listItem.classList.add('transcription-item');
        listItem.setAttribute('role', 'listitem');
        listItem.id = `caption-${index}`;

        const leftColumn = h5pDocument.createElement('div');
        leftColumn.classList.add('left-column');
        const timeButton = h5pDocument.createElement('button');
        timeButton.classList.add('timestamp-button');
        timeButton.textContent = formatTime(caption.start);
        timeButton.onclick = () => {
            const videoElement = h5pDocument.querySelector('video');
            videoElement.currentTime = caption.start;
            videoElement.play();
        };
        leftColumn.appendChild(timeButton);

        const rightColumn = h5pDocument.createElement('div');
        rightColumn.classList.add('right-column');
        rightColumn.textContent = caption.text.trim();
        rightColumn.onclick = () => {
            const videoElement = h5pDocument.querySelector('video');
            videoElement.currentTime = caption.start;
            videoElement.play();
        };

        listItem.appendChild(leftColumn);
        listItem.appendChild(rightColumn);

        colText.appendChild(listItem);
    });

    const videoElement = h5pDocument.querySelector('video');
    videoElement.addEventListener('timeupdate', () => {
        const currentTime = videoElement.currentTime;
        captions.forEach((caption, index) => {
            const listItem = h5pDocument.getElementById(`caption-${index}`);
            if (currentTime >= caption.start && currentTime <= caption.end) {
                listItem.classList.add('highlighted');

                colText.scrollTo({
                    top: listItem.offsetTop - colText.clientHeight / 2 + listItem.clientHeight / 2,
                    behavior: 'smooth'
                });
            } else {
                listItem.classList.remove('highlighted');
            }
        });
    });


}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function processVTT(vttData) {
    const lines = vttData.split('\n');
    const captions = [];
    let currentCaption = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (line === 'WEBVTT' || line === '') continue;

        if (line.match(/^[a-f0-9-]+$/) && i + 1 < lines.length) {
            i++;
            line = lines[i].trim();
        }

        if (line.includes('-->')) {
            if (currentCaption) {
                captions.push(currentCaption);
            }
            const times = line.split(' --> ');
            currentCaption = {
                start: parseTime(times[0].trim()),
                end: parseTime(times[1].trim()),
                text: ''
            };
        }
        else if (line.length > 0 && currentCaption) {
            currentCaption.text += line + ' ';
        }
    }

    if (currentCaption) captions.push(currentCaption);

    return captions;
}

function parseTime(timeString) {
    const timeParts = timeString.split(":");
    if (timeParts.length === 3) {
        const hours = parseInt(timeParts[0], 10) * 3600;
        const minutes = parseInt(timeParts[1], 10) * 60;
        const secondsParts = timeParts[2].split('.');
        const seconds = parseInt(secondsParts[0], 10);
        const milliseconds = secondsParts[1] ? parseInt(secondsParts[1], 10) / 1000 : 0;
        return hours + minutes + seconds + milliseconds;
    } else if (timeParts.length === 2) {
        const minutes = parseInt(timeParts[0], 10) * 60;
        const secondsParts = timeParts[1].split('.');
        const seconds = parseInt(secondsParts[0], 10);
        const milliseconds = secondsParts[1] ? parseInt(secondsParts[1], 10) / 1000 : 0;
        return minutes + seconds + milliseconds;
    }
    return 0;
}

function syncSubtitlesWithScroll(videoElement, captions, h5pDocument, type, slideIndex = null) {
    const colTextId = slideIndex !== null ? `captions-container-slide-${slideIndex}` : `captions-container-${type}`;
    const colText = h5pDocument.getElementById(colTextId);
    console.log(`[${type}] Contenedor de subtítulos encontrado:`, colText ? "Sí" : "No");

    let isUserInteracting = false;
    let inactivityTimeout;

    const handleTimeUpdate = () => {
        const currentTime = videoElement.currentTime;
        if (!colText) return;

        captions.forEach((caption, index) => {
            const captionId = slideIndex !== null ? `caption-slide-${slideIndex}-${index}` : `caption-${type}-${index}`;
            const captionElement = h5pDocument.getElementById(captionId);
            if (!captionElement) return;

            if (currentTime >= caption.start && currentTime <= caption.end) {
                captionElement.style.fontWeight = 'bold';
                captionElement.style.backgroundColor = '#a9c1c7';

                if (!isUserInteracting) {
                    const scrollTo = captionElement.offsetTop - (colText.clientHeight / 2) + (captionElement.offsetHeight / 2);
                    colText.scrollTo({ top: scrollTo, behavior: 'smooth' });
                    console.log(`[${type}] Subtítulo centrado en índice ${index}`);
                }
            } else {
                captionElement.style.fontWeight = 'normal';
                captionElement.style.backgroundColor = 'transparent';
            }
        });
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    const resetInactivityTimer = () => {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        isUserInteracting = true;

        inactivityTimeout = setTimeout(() => {
            isUserInteracting = false;
            console.log(`[${type}] Usuario inactivo. Centrando subtítulo nuevamente.`);
        }, 3500);
    };

    if (colText) {
        colText.addEventListener('scroll', resetInactivityTimer);
        colText.addEventListener('mousemove', resetInactivityTimer);
    }
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

    // Crear una nueva opción en el menú de subtítulos
    const customOption = h5pDocument.createElement('li');
    customOption.textContent = 'Transcripción';
    customOption.style.marginLeft = '8px';
    customOption.style.alignItems = 'center';
    customOption.setAttribute('tabindex', '0');
    customOption.setAttribute('aria-checked', 'false');
    customOption.style.cursor = 'pointer';

    // Añadir evento al hacer clic en la nueva opción
    customOption.addEventListener('click', () => {
        const colText = h5pDocument.getElementById('captions-container-iv');
        const colH5P = h5pDocument.getElementById('col-h5p');
        const videoElement = h5pDocument.querySelector('video');

        if (!colText || !colH5P || !videoElement) {
            console.error("No se encontró alguno de los elementos requeridos (colText, colH5P, videoElement).");
            return;
        }

        if (colText.classList.contains('d-none')) {
            // Mostrar subtítulos y reducir la columna de video
            colText.classList.remove('d-none');
            colH5P.classList.remove('col-sm-12');
            colH5P.classList.add('col-sm-8');
            colH5P.style.width = ''; 
            videoElement.style.height = 'auto'; // Ajusta el video a su tamaño normal
            customOption.setAttribute('aria-checked', 'true');
        } else {
            // Ocultar subtítulos y ampliar la columna de video
            colText.classList.add('d-none');
            colH5P.style.width = '100%';
            colH5P.classList.remove('col-sm-8');
            colH5P.classList.add('col-sm-12');

            // Aquí calculamos la altura exacta del video para evitar que se corte
            adjustVideoHeight(colH5P, videoElement);

            customOption.setAttribute('aria-checked', 'false');
        }

        // Forzar el ajuste del contenedor después del cambio
        colH5P.style.display = 'flex';
        colH5P.style.alignItems = 'center';
        colH5P.style.justifyContent = 'center';

        console.log('Subtítulos alternados y el video ajustado.');
    });

    captionsMenu.appendChild(customOption);
}

// Función para ajustar dinámicamente la altura del video
function adjustVideoHeight(container, videoElement) {
    const containerHeight = container.offsetHeight; // Altura total disponible en el contenedor
    const videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight; // Relación de aspecto del video

    const newVideoHeight = containerHeight; // Queremos que el video ocupe todo el contenedor verticalmente
    const newVideoWidth = newVideoHeight * videoAspectRatio; // Calculamos el nuevo ancho basado en la relación de aspecto

    videoElement.style.height = `${newVideoHeight}px`; // Asignamos la nueva altura
    videoElement.style.width = `${newVideoWidth}px`; // Asignamos el nuevo ancho

    // Asegurarse de que el video se ajuste correctamente
    videoElement.style.objectFit = 'contain'; // Esto previene recortes indeseados
    videoElement.style.overflow = 'hidden';

    console.log(`Video ajustado a ${newVideoWidth}px x ${newVideoHeight}px.`);
}


/* ANTIGUO GRID PARA -> CP
function createGridLayout(h5pDocument, slide, videoElement, captions, slideIndex) {
    const container = h5pDocument.createElement('div');
    container.classList.add('container-fluid');

    const row = h5pDocument.createElement('div');
    row.classList.add('row');
    container.appendChild(row);

    const colVideo = h5pDocument.createElement('div');
    colVideo.classList.add('col-12', 'col-sm-8');
    colVideo.style.display = 'flex';
    colVideo.style.alignItems = 'center';
    colVideo.style.justifyContent = 'center';
    colVideo.style.minHeight = 'auto';
    colVideo.style.overflow = 'hidden';
    videoElement.style.height = 'auto';
    videoElement.style.maxHeight = '100%';
    videoElement.controls = true;
    colVideo.appendChild(videoElement);
    row.appendChild(colVideo);

    const colText = h5pDocument.createElement('div');
    colText.classList.add('col-12', 'col-sm-4');
    colText.id = `captions-container-slide-${slideIndex}`;
    colText.style.overflowY = 'auto';
    colText.style.flexGrow = '1';
    row.appendChild(colText);

    const style = h5pDocument.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
    
        .container-fluid, .row, .col-12, .col-sm-8, .col-sm-4 {
        height: 100vh !important;
       }
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
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
        }
        .right-column {
            flex: 5;
            font-size: 14px;
            color: #333;
            padding-left: 8px;
            text-align: justify;
        }
        .highlighted {
            background-color: #cae4e8;
            font-weight: bold;
        }
    `;
    h5pDocument.head.appendChild(style);

    captions.forEach((caption, index) => {
        const listItem = h5pDocument.createElement('div');
        listItem.classList.add('transcription-item');
        listItem.setAttribute('role', 'listitem');
        listItem.id = `caption-slide-${slideIndex}-${index}`;

        const leftColumn = h5pDocument.createElement('div');
        leftColumn.classList.add('left-column');
        const timeButton = h5pDocument.createElement('button');
        timeButton.classList.add('timestamp-button');
        timeButton.textContent = formatTime(caption.start);
        timeButton.onclick = () => {
            videoElement.currentTime = caption.start;
            videoElement.play();
        };
        leftColumn.appendChild(timeButton);

        const rightColumn = h5pDocument.createElement('div');
        rightColumn.classList.add('right-column');
        rightColumn.textContent = caption.text.trim();

        rightColumn.onclick = () => {
            videoElement.currentTime = caption.start;
            videoElement.play();
        };

        listItem.appendChild(leftColumn);
        listItem.appendChild(rightColumn);
        colText.appendChild(listItem);
    });

    return container;
}
*/

function setIframeHeight() {
    const interval = setInterval(() => {
        const iframeWrapper = document.querySelector('.h5p-iframe-wrapper');
        if (iframeWrapper) {
            const iframe = iframeWrapper.querySelector('iframe');
            if (iframe) {
                clearInterval(interval);
                console.log("iframe encontrado dentro del wrapper");
                iframe.style.height = '550px';
                console.log('Altura del iframe modificada');
            } else {
                console.log('Buscando el iframe...');
            }
        } else {
            console.log('Buscando el wrapper...');
        }
    }, 500);
}

window.addEventListener('load', setIframeHeight);




