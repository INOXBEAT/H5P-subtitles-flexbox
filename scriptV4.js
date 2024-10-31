// Identifica el contenedor de video y el elemento <track> dentro del iframe H5P
function identifyVideoAndTrackElements(iframeDocument) {
    console.info("Identificando el contenedor de video y el elemento <track>...");
    const interactiveVideoContainer = iframeDocument.querySelector('.h5p-container.h5p-standalone.h5p-interactive-video');
    const trackElement = iframeDocument.querySelector('track');
    
    if (interactiveVideoContainer && trackElement) {
        console.info("Contenedor de video y elemento <track> encontrados.");
        return { interactiveVideoContainer, trackElement };
    }
    console.warn("No se encontró el contenedor de video o el elemento <track>.");
    return null;
}

// Crea un contenedor principal que se ajusta al ancho del body dentro del iframe
function createMainContainer(iframeDocument) {
    console.info("Creando contenedor principal en el iframe...");
    const mainContainer = iframeDocument.createElement('div');
    Object.assign(mainContainer.style, {
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px',
    });
    mainContainer.id = 'main-flex-container';
    iframeDocument.body.appendChild(mainContainer);
    console.info("Contenedor principal creado:", mainContainer);
    return mainContainer;
}

// Crea un elemento flexbox con secciones A y B
function createFlexboxSections(mainContainer, iframeDocument) {
    console.info("Creando flexbox con secciones A y B...");
    const flexContainer = iframeDocument.createElement('div');
    Object.assign(flexContainer.style, {
        display: 'flex',
        width: '100%',
    });

    const createSection = (width, color) => {
        const section = iframeDocument.createElement('div');
        Object.assign(section.style, {
            width,
            boxSizing: 'border-box',
            padding: '10px',
            backgroundColor: color,
        });
        return section;
    };

    const sectionA = createSection('66.67%', '#f0f0f0');
    const sectionB = createSection('33.33%', '#d0d0d0');
    flexContainer.appendChild(sectionA);
    flexContainer.appendChild(sectionB);
    mainContainer.appendChild(flexContainer);

    console.info("Flexbox y secciones creadas correctamente:", { sectionA, sectionB });
    return { sectionA, sectionB };
}

// Coloca los recursos de video y muestra el contenido del track en las secciones A y B
function placeResourcesInSections(sectionA, sectionB, interactiveVideoContainer, trackElement) {
    console.info("Colocando el contenedor de video y el contenido del <track> en las secciones...");
    sectionA.appendChild(interactiveVideoContainer);

    if (trackElement.src) {
        fetch(trackElement.src)
            .then(response => response.ok ? response.text() : Promise.reject("No se pudo cargar el contenido del <track>."))
            .then(trackContent => {
                const trackContentDiv = document.createElement('div');
                trackContentDiv.textContent = trackContent;
                sectionB.appendChild(trackContentDiv);
                console.info("Contenido del <track> mostrado en la sección B.");
            })
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
    console.info("Agregando opciones de transcripción y controles de tamaño de fuente al menú de subtítulos...");

    const transcriptionOption = h5pDocument.createElement('li');
    transcriptionOption.setAttribute('role', 'menuitemradio');
    transcriptionOption.textContent = 'Transcripción';
    transcriptionOption.style.cursor = 'pointer';
    transcriptionOption.addEventListener('click', () => toggleTranscriptionVisibility(sectionA, sectionB, transcriptionOption));
    menuList.appendChild(transcriptionOption);

    const fontSizeControlItem = h5pDocument.createElement('li');
    const iconContainer = h5pDocument.createElement('div');
    Object.assign(iconContainer.style, { display: 'flex', alignItems: 'center' });

    // Crear iconos de ajuste de tamaño de fuente
    const increaseFontIcon = createFontSizeIcon(h5pDocument, 'Increase Font Size', 24, 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-plus-round-512.png');
    const decreaseFontIcon = createFontSizeIcon(h5pDocument, 'Decrease Font Size', 24, 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-minus-round-512.png');

    // Eventos para ajustar el tamaño de fuente
    let currentFontSize = 16;
    sectionB.style.fontSize = `${currentFontSize}px`;

    increaseFontIcon.onclick = () => adjustFontSize(currentFontSize += 2, sectionB, 34);
    decreaseFontIcon.onclick = () => adjustFontSize(currentFontSize -= 2, sectionB, 10);

    iconContainer.appendChild(increaseFontIcon);
    iconContainer.appendChild(decreaseFontIcon);
    fontSizeControlItem.appendChild(iconContainer);
    menuList.appendChild(fontSizeControlItem);
    console.info("Opciones de transcripción y controles de tamaño de fuente añadidos.");
}

// Función auxiliar para crear icono de ajuste de tamaño de fuente
function createFontSizeIcon(h5pDocument, alt, size, src) {
    const icon = h5pDocument.createElement('img');
    Object.assign(icon, { alt, src });
    Object.assign(icon.style, { width: `${size}px`, height: `${size}px`, cursor: 'pointer', margin: '0 8px' });
    return icon;
}

// Alterna la visibilidad de la sección de transcripción
function toggleTranscriptionVisibility(sectionA, sectionB, transcriptionOption) {
    const isVisible = sectionB.style.display === 'none';
    sectionB.style.display = isVisible ? 'block' : 'none';
    sectionA.style.width = isVisible ? '66.66%' : '100%';
    transcriptionOption.setAttribute('aria-checked', isVisible.toString());
    console.info(`Transcripción ${isVisible ? "mostrada" : "ocultada"}.`);
}

// Ajusta el tamaño de la fuente en la sección de transcripción
function adjustFontSize(size, sectionB, limit) {
    if (size >= 10 && size <= 34) {
        sectionB.style.fontSize = `${size}px`;
        console.info(`Tamaño de fuente ajustado a: ${size}px.`);
    }
}

// Función de inicialización que configura los elementos y el menú de subtítulos
function initializeH5PContent(iframeDocument) {
    console.info("Iniciando contenido H5P...");
    const elements = identifyVideoAndTrackElements(iframeDocument);

    if (elements) {
        const mainContainer = createMainContainer(iframeDocument);
        const { sectionA, sectionB } = createFlexboxSections(mainContainer, iframeDocument);
        placeResourcesInSections(sectionA, sectionB, elements.interactiveVideoContainer, elements.trackElement);

        const controlsContainer = iframeDocument.querySelector('.h5p-controls');
        if (controlsContainer) {
            console.info("Contenedor de controles encontrado. Observando el botón de subtítulos...");
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
