// Identifica el contenedor de video y el elemento <track> dentro del iframe H5P
function identifyVideoAndTrackElements(iframeDocument) {
    const interactiveVideoContainer = iframeDocument.querySelector('.h5p-container.h5p-standalone.h5p-interactive-video');
    const trackElement = iframeDocument.querySelector('track');
    
    return (interactiveVideoContainer && trackElement) 
        ? { interactiveVideoContainer, trackElement } 
        : (console.warn("No se encontró el contenedor de video o el elemento <track>."), null);
}

// Crea un contenedor principal que se ajusta al ancho del body dentro del iframe
function createMainContainer(iframeDocument) {
    const mainContainer = iframeDocument.createElement('div');
    Object.assign(mainContainer.style, {
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px',
    });
    mainContainer.id = 'main-flex-container';
    iframeDocument.body.appendChild(mainContainer);
    return mainContainer;
}

// Crea un elemento flexbox con secciones A y B
function createFlexboxSections(mainContainer, iframeDocument) {
    const flexContainer = iframeDocument.createElement('div');
    Object.assign(flexContainer.style, { display: 'flex', width: '100%' });

    const createSection = (width, color) => {
        const section = iframeDocument.createElement('div');
        Object.assign(section.style, { width, boxSizing: 'border-box', padding: '10px', backgroundColor: color });
        return section;
    };

    const sectionA = createSection('66.67%', '#f0f0f0');
    const sectionB = createSection('33.33%', '#d0d0d0');
    sectionB.style.display = 'none';
    sectionA.style.width = '100%';
    flexContainer.append(sectionA, sectionB);
    mainContainer.appendChild(flexContainer);

    return { sectionA, sectionB };
}

// Inserta el contenedor de video y formatea el contenido de subtítulos en la sección B
function placeResourcesInSections(sectionA, sectionB, interactiveVideoContainer, trackElement) {
    sectionA.appendChild(interactiveVideoContainer);

    if (trackElement.src) {
        fetch(trackElement.src)
            .then(response => response.ok ? response.text() : Promise.reject("No se pudo cargar el contenido del <track>."))
            .then(vttContent => formatCaptions(sectionB, vttContent))
            .catch(error => {
                console.warn(error);
                sectionB.textContent = "No se pudo mostrar el contenido del <track>.";
            });
    } else {
        console.warn("El <track> no tiene contenido disponible.");
        sectionB.textContent = "El <track> no tiene contenido disponible.";
    }
}

// Agrega opciones de transcripción y controles de tamaño de fuente en el menú de subtítulos
function createTranscriptionAndFontSizeOptions(h5pDocument, menuList, sectionA, sectionB) {
    const transcriptionOption = h5pDocument.createElement('li');
    transcriptionOption.setAttribute('role', 'menuitemradio');
    transcriptionOption.setAttribute('aria-checked', 'false');
    transcriptionOption.textContent = 'Transcripción';
    transcriptionOption.style.cursor = 'pointer';
    transcriptionOption.addEventListener('click', () => toggleTranscriptionVisibility(sectionA, sectionB, transcriptionOption));
    menuList.appendChild(transcriptionOption);

    const fontSizeControlItem = h5pDocument.createElement('li');
    const iconContainer = h5pDocument.createElement('div');
    Object.assign(iconContainer.style, { display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' });

    // Crear iconos de ajuste de tamaño de fuente
    const increaseFontIcon = createFontSizeIcon(h5pDocument, 'Increase Font Size', 24, 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-plus-round-512.png');
    const decreaseFontIcon = createFontSizeIcon(h5pDocument, 'Decrease Font Size', 24, 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-minus-round-512.png');

    // Eventos para ajustar el tamaño de fuente
    let currentFontSize = 16;
    sectionB.style.fontSize = `${currentFontSize}px`;

    increaseFontIcon.onclick = () => adjustFontSize(currentFontSize += 2, sectionB, 34);
    decreaseFontIcon.onclick = () => adjustFontSize(currentFontSize -= 2, sectionB, 10);

    iconContainer.append(increaseFontIcon, decreaseFontIcon);
    fontSizeControlItem.appendChild(iconContainer);
    menuList.appendChild(fontSizeControlItem);
}

// Función auxiliar para crear icono de ajuste de tamaño de fuente
function createFontSizeIcon(h5pDocument, alt, size, src) {
    const icon = h5pDocument.createElement('img');
    Object.assign(icon, { alt, src });
    Object.assign(icon.style, {
        width: `${size}px`,
        height: `${size}px`,
        cursor: 'pointer',
        margin: '0 8px',
        filter: 'invert(1) sepia(0) saturate(0) hue-rotate(180deg) brightness(200%)',
        border: '2px solid #000000',
        borderRadius: '4px'
    });
    return icon;
}

// Alterna la visibilidad de la sección de transcripción
function toggleTranscriptionVisibility(sectionA, sectionB, transcriptionOption) {
    const isVisible = sectionB.style.display === 'none';
    sectionB.style.display = isVisible ? 'block' : 'none';
    sectionA.style.width = isVisible ? '66.66%' : '100%';
    transcriptionOption.setAttribute('aria-checked', isVisible.toString());
}

// Ajusta el tamaño de la fuente en la sección de transcripción
function adjustFontSize(size, sectionB, limit) {
    if (size >= 10 && size <= 34) {
        sectionB.style.fontSize = `${size}px`;
    }
}

// Función para dar formato a los subtítulos en sectionB eliminando el título WEBVTT
function formatCaptions(sectionB, vttContent) {
    sectionB.innerHTML = '';
    const lines = vttContent.split('\n');
    const filteredLines = lines.filter(line => line.trim() !== 'WEBVTT' && line.trim() !== '');

    filteredLines.forEach((line, index) => {
        if (line.includes('-->')) {
            const [start, end] = line.split(' --> ').map(formatTime);
            const listItem = document.createElement('div');
            listItem.style.display = 'flex';
            listItem.style.alignItems = 'center';
            listItem.style.padding = '8px';
            listItem.style.borderBottom = '1px solid #e0e0e0';

            const timeColumn = document.createElement('div');
            timeColumn.style.flex = '1 1 25%';
            timeColumn.style.textAlign = 'center';
            timeColumn.style.fontWeight = 'bold';
            timeColumn.textContent = `${start}`;

            const textColumn = document.createElement('div');
            textColumn.style.flex = '1 1 75%';
            textColumn.style.paddingLeft = '10px';
            textColumn.style.textAlign = 'justify';
            textColumn.textContent = filteredLines[index + 1] || '';

            listItem.append(timeColumn, textColumn);
            sectionB.appendChild(listItem);
        }
    });
}

// Función auxiliar para formatear el tiempo en mm:ss
function formatTime(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(parseFloat);
    const totalMinutes = hours * 60 + minutes;
    return `${totalMinutes}:${seconds < 10 ? '0' : ''}${seconds.toFixed(0)}`;
}

// Función de inicialización que configura los elementos y el menú de subtítulos
function initializeH5PContent(iframeDocument) {
    const elements = identifyVideoAndTrackElements(iframeDocument);

    if (elements) {
        const mainContainer = createMainContainer(iframeDocument);
        const { sectionA, sectionB } = createFlexboxSections(mainContainer, iframeDocument);
        placeResourcesInSections(sectionA, sectionB, elements.interactiveVideoContainer, elements.trackElement);

        const controlsContainer = iframeDocument.querySelector('.h5p-controls');
        if (controlsContainer) {
            const observer = new MutationObserver(() => {
                const captionsButton = controlsContainer.querySelector('.h5p-control.h5p-captions');
                if (captionsButton) {
                    captionsButton.click();
                    observer.disconnect();

                    const captionsMenu = iframeDocument.querySelector('.h5p-chooser.h5p-captions ol');
                    if (captionsMenu) {
                        createTranscriptionAndFontSizeOptions(iframeDocument, captionsMenu, sectionA, sectionB);
                    } else {
                        console.warn("No se encontró el menú de subtítulos.");
                    }
                }
            });
            observer.observe(controlsContainer, { childList: true, subtree: true });
        } else {
            console.warn("No se encontró el contenedor de controles (.h5p-controls) en el iframe.");
        }
    }
}

// Inicialización de elementos en el iframe al cargar el documento
document.addEventListener('DOMContentLoaded', function () {
    const observer = new MutationObserver(() => {
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
            observer.disconnect();
            initializeH5PContent(iframe.contentDocument);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
});
