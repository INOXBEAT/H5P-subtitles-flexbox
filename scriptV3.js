window.onload = function () {
    const h5pWrapper = document.querySelector('.h5p-iframe-wrapper');
    if (h5pWrapper) {
        const h5pIframe = h5pWrapper.querySelector('iframe');
        if (h5pIframe) {
            try {
                const h5pDocument = h5pIframe.contentDocument || h5pIframe.contentWindow.document;

                if (h5pDocument.readyState === 'complete') {
                    // Identificar la clase h5p-controls
                    const h5pControls = h5pDocument.querySelector('.h5p-controls');
                    if (h5pControls) {
                        
                        const sliderHandleSpan = h5pControls.querySelector('span.ui-slider-handle.ui-corner-all.ui-state-default');
                        if (sliderHandleSpan) {
                            const ariaValueText = sliderHandleSpan.getAttribute('aria-valuetext');
                            if (ariaValueText) {
                            }
                        }
                    }

                    const interactiveVideoContainer = h5pDocument.querySelector('.h5p-container.h5p-standalone.h5p-interactive-video');

                    if (interactiveVideoContainer) {

                        const trackElement = interactiveVideoContainer.querySelector('track');

                        if (trackElement) {

                            // Agregar estilos CSS
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

                            // Crear el contenedor principal y las secciones de video y subtítulos
                            const mainContainer = h5pDocument.createElement('div');
                            mainContainer.className = 'mainContainer';
                            mainContainer.style.width = '100%';
                            mainContainer.style.height = '100%';
                            mainContainer.style.position = 'relative';
                            h5pDocument.body.appendChild(mainContainer);

                             // Sección A para el video
                            const sectionA = h5pDocument.createElement('div');
                            sectionA.className = 'seccionA';
                            sectionA.style.width = '100%';
                            sectionA.style.height = '100%';
                            sectionA.style.position = 'absolute';
                            sectionA.style.top = '0';
                            sectionA.style.left = '0';
                            sectionA.style.zIndex = '300';
                            sectionA.appendChild(interactiveVideoContainer);

                            // Sección B para los subtítulos
                            const sectionB = h5pDocument.createElement('div');
                            sectionB.className = 'seccionB';
                            sectionB.style.width = '33%';
                            sectionB.style.height = '100%';
                            sectionB.style.position = 'absolute';
                            sectionB.style.top = '0';
                            sectionB.style.right = '0';
                            sectionB.style.zIndex = '300';
                            sectionB.style.overflowY = 'auto';
                            sectionB.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                            sectionB.style.display = 'none';

                            // Añadir secciones al contenedor principal
                            mainContainer.appendChild(sectionA);
                            mainContainer.appendChild(sectionB);

                            // Cargar los subtítulos desde el archivo VTT
                            const trackSrc = trackElement.getAttribute('src');
                            if (trackSrc) {
                                fetch(trackSrc)
                                    .then(response => response.text())
                                    .then(vttData => {
                                        const subtitles = parseVTT(vttData); // Parsear el archivo VTT
                                        subtitles.forEach((subtitle, index) => {
                                            // Crear contenedor para cada subtítulo
                                            const subtitleContainer = h5pDocument.createElement('div');
                                            subtitleContainer.className = 'transcription-item';
                                            subtitleContainer.setAttribute('id', `listItem-${index}`);

                                            // Columna izquierda con el botón de timestamp
                                            const leftColumn = h5pDocument.createElement('div');
                                            leftColumn.className = 'left-column';
                                            const timestampButton = h5pDocument.createElement('button');
                                            timestampButton.className = 'timestamp-button';
                                            timestampButton.textContent = formatTimestamp(subtitle.start); // Formatear timestamp
                                            // Al hacer clic, mover el video al tiempo correspondiente
                                            timestampButton.onclick = () => {
                                                const videoElement = h5pDocument.querySelector('video');
                                                videoElement.currentTime = parseFloat(subtitle.start);
                                                videoElement.play();
                                            };
                                            leftColumn.appendChild(timestampButton);

                                            // Columna derecha con el texto del subtítulo
                                            const rightColumn = h5pDocument.createElement('div');
                                            rightColumn.className = 'right-column';
                                            rightColumn.textContent = subtitle.text;
                                            // Al hacer clic, también mover el video al tiempo correspondiente
                                            rightColumn.onclick = () => {
                                                const videoElement = h5pDocument.querySelector('video');
                                                videoElement.currentTime = parseFloat(subtitle.start);
                                                videoElement.play();
                                            };

                                            // Añadir columnas al contenedor de subtítulos
                                            subtitleContainer.appendChild(leftColumn);
                                            subtitleContainer.appendChild(rightColumn);
                                            sectionB.appendChild(subtitleContainer);
                                        });

                                    })
                                    .catch(error => console.error('Error al cargar el archivo de subtítulos:', error));
                            }

                            // Sincronizar transcripciones con el tiempo del video
                            const videoElement = h5pDocument.querySelector('video');
                            videoElement.addEventListener('timeupdate', () => {
                                const currentTime = videoElement.currentTime;
                                subtitles.forEach((subtitle, index) => {
                                    const listItem = h5pDocument.getElementById(`listItem-${index}`);
                                    if (currentTime >= parseFloat(subtitle.start) && currentTime <= parseFloat(subtitle.end)) {
                                        listItem.classList.add('highlighted');
                                        sectionB.scrollTo({
                                            top: listItem.offsetTop - sectionB.clientHeight / 2 + listItem.clientHeight / 2,
                                            behavior: 'smooth'
                                        });
                                    } else {
                                        listItem.classList.remove('highlighted');
                                    }
                                });
                            });

                            // Agregar opción de "Transcription" en el menú de subtítulos
                            const captionsButton = h5pDocument.querySelector('.h5p-control.h5p-captions');
                            if (captionsButton) {
                                captionsButton.click();
                                setTimeout(() => {
                                    const captionsMenu = h5pDocument.querySelector('.h5p-chooser.h5p-captions.h5p-show');
                                    if (captionsMenu) {
                                        const menuList = captionsMenu.querySelector('ol[role="menu"]');
                                        if (menuList) {
                                            
                                            const transcriptionOption = h5pDocument.createElement('li');
                                            transcriptionOption.setAttribute('role', 'menuitemradio');
                                            transcriptionOption.setAttribute('aria-checked', 'false');
                                            transcriptionOption.setAttribute('aria-describedby', 'interactive-video-menu-captions');
                                            transcriptionOption.textContent = 'Transcription';
                                            transcriptionOption.addEventListener('click', () => {
                                                const isVisible = sectionB.style.display === 'none';
                                                sectionB.style.display = isVisible ? 'block' : 'none';
                                                sectionA.style.width = isVisible ? '66.66%' : '100%';
                                                transcriptionOption.setAttribute('aria-checked', isVisible.toString());
                                            });
                                            menuList.appendChild(transcriptionOption);
                                            
                                            const transcriptionControl = h5pDocument.createElement('li');
                                            transcriptionControl.style.margin = '0 8px 0 8px';
                                            transcriptionControl.textContent = 'Tamaño de fuente';
                                            transcriptionControl.addEventListener('click', () => {
                                                const isVisible = sectionB.style.display === 'none';
                                                sectionB.style.display = isVisible ? 'block' : 'none';
                                                sectionA.style.width = isVisible ? '66.66%' : '100%'; 
                                                transcriptionOption.setAttribute('aria-checked', isVisible.toString());
                                            });
                                            menuList.appendChild(transcriptionControl);

                                            // Crear el elemento <li> para los controles de tamaño de fuente
                                            const fontSizeControlItem = h5pDocument.createElement('li');

                                            // Crear un contenedor para los íconos y el texto
                                            const iconContainer = h5pDocument.createElement('div');
                                            iconContainer.style.display = 'flex'; 
                                            iconContainer.style.alignItems = 'center'; 
                                            iconContainer.style.justifyContent = 'center'; 
                                            iconContainer.style.margin = '8px 0'; 
                                            
                                            // Crear el ícono para aumentar el tamaño de la fuente
                                            const increaseFontIcon = h5pDocument.createElement('img');
                                            increaseFontIcon.src = 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-plus-round-512.png';
                                            //increaseFontIcon.src = 'https://cdn2.iconfinder.com/data/icons/picons-basic-2/57/basic2-064_font_larger-512.png';
                                            increaseFontIcon.alt = 'Increase Font Size';
                                            increaseFontIcon.style.width = '24px'; 
                                            increaseFontIcon.style.height = '24px'; 
                                            increaseFontIcon.style.cursor = 'pointer'; 
                                            increaseFontIcon.style.marginRight = '8px'; 
                                            increaseFontIcon.style.filter = 'invert(1) sepia(0) saturate(0) hue-rotate(180deg) brightness(200%)';
                                            increaseFontIcon.style.border = '2px solid #000000';
                                            increaseFontIcon.style.borderRadius = '4px';
                                            
                                            // Crear el ícono para disminuir el tamaño de la fuente
                                            const decreaseFontIcon = h5pDocument.createElement('img');
                                            decreaseFontIcon.src = 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-minus-round-512.png';
                                            //decreaseFontIcon.src = 'https://cdn2.iconfinder.com/data/icons/picons-basic-2/57/basic2-063_font_smaller-512.png';
                                            decreaseFontIcon.alt = 'Decrease Font Size';
                                            decreaseFontIcon.style.width = '24px'; 
                                            decreaseFontIcon.style.height = '24px'; 
                                            decreaseFontIcon.style.cursor = 'pointer'; 
                                            decreaseFontIcon.style.marginLeft = '8px'; 
                                            decreaseFontIcon.style.filter = 'invert(1) sepia(0) saturate(0) hue-rotate(180deg) brightness(200%)';
                                            decreaseFontIcon.style.border = '2px solid #000000';
                                            decreaseFontIcon.style.borderRadius = '4px';
                                            
                                            // Crear el hovertip
                                            const hovertip = h5pDocument.createElement('div');
                                            hovertip.className = 'hovertip';
                                            hovertip.style.position = 'absolute';
                                            hovertip.style.backgroundColor = '#333';
                                            hovertip.style.color = '#fff';
                                            hovertip.style.padding = '5px 10px';
                                            hovertip.style.borderRadius = '4px';
                                            hovertip.style.fontSize = '12px';
                                            hovertip.style.zIndex = '1000';
                                            hovertip.style.display = 'none'; // Oculto por defecto
                                            h5pDocument.body.appendChild(hovertip);
                                            
                                            // Función para mostrar el hovertip
                                            function showHoverTip(event, message) {
                                                hovertip.textContent = message;
                                                hovertip.style.left = `${event.pageX + 10}px`; 
                                                hovertip.style.top = `${event.pageY + 10}px`;
                                                hovertip.style.display = 'block';
                                            }
                                            
                                            // Función para ocultar el hovertip
                                            function hideHoverTip() {
                                                hovertip.style.display = 'none'; 
                                            }
                                            
                                            // Agregar eventos a los íconos de tamaño de fuente
                                            increaseFontIcon.addEventListener('mouseover', (event) => showHoverTip(event, 'Aumentar letra'));
                                            increaseFontIcon.addEventListener('mouseout', hideHoverTip);
                                            
                                            decreaseFontIcon.addEventListener('mouseover', (event) => showHoverTip(event, 'Disminuir letra'));
                                            decreaseFontIcon.addEventListener('mouseout', hideHoverTip);

                                            // Inicializar el tamaño de fuente
                                            let currentFontSize = 16; 
                                            sectionB.style.fontSize = `${currentFontSize}px`;
                                            
                                            // Función para aplicar el tamaño de fuente a las columnas de transcripción
                                            const applyFontSizeToTranscriptions = (size) => {
                                                const transcriptionItems = h5pDocument.querySelectorAll('.transcription-item');
                                                transcriptionItems.forEach(item => {
                                                    const leftColumn = item.querySelector('.left-column');
                                                    const rightColumn = item.querySelector('.right-column');
                                            
                                                    if (leftColumn) {
                                                        leftColumn.style.fontSize = `${size}px`; 
                                                    }
                                            
                                                    if (rightColumn) {
                                                        rightColumn.style.fontSize = `${size}px`;
                                                    }
                                                });
                                            };
                                            
                                            // Aplicar tamaño inicial
                                            applyFontSizeToTranscriptions(currentFontSize);
                                            
                                            // Añadir eventos para aumentar y disminuir el tamaño de la fuente
                                            increaseFontIcon.onclick = () => {
                                                if (currentFontSize < 34) { 
                                                    currentFontSize += 2; 
                                                    applyFontSizeToTranscriptions(currentFontSize); 
                                                }
                                            };
                                            
                                            decreaseFontIcon.onclick = () => {
                                                if (currentFontSize > 10) { 
                                                    currentFontSize -= 2; 
                                                    applyFontSizeToTranscriptions(currentFontSize);
                                                }
                                            };

                                            // Agregar íconos al contenedor
                                            iconContainer.appendChild(increaseFontIcon);
                                            iconContainer.appendChild(decreaseFontIcon);

                                            // Agregar el contenedor al elemento <li>
                                            fontSizeControlItem.appendChild(iconContainer);
                                            
                                            // Insertar el nuevo elemento <li> debajo del de "Transcription"
                                            menuList.appendChild(fontSizeControlItem);

                                        }
                                    }
                                }, 500);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error accediendo al contenido del iframe:', error.message);
            }
        }
    }
};

// Función para procesar el archivo VTT sin incluir "WEBVTT"
function parseVTT(vttData) {
    const subtitleEntries = [];
    const lines = vttData.split('\n').filter(line => line.trim() !== 'WEBVTT');
    let currentSubtitle = { start: '', end: '', text: '' };

    lines.forEach(line => {
        if (line.includes('-->')) {
            const [start, end] = line.split(' --> ');
            currentSubtitle = { start: start.trim(), end: end.trim(), text: '' };
        } else if (line.trim() === '') {
            if (currentSubtitle.text) {
                subtitleEntries.push(currentSubtitle);
            }
            currentSubtitle = { start: '', end: '', text: '' };
        } else {
            currentSubtitle.text += line.trim() + ' ';
        }
    });

    return subtitleEntries;
}

// Formato de tiempo para mm:ss
function formatTimestamp(timestamp) {
    const [hours, minutes, seconds] = timestamp.split(':');
    return `${parseInt(minutes)}:${parseInt(seconds.split('.')[0]).toString().padStart(2, '0')}`;
}

