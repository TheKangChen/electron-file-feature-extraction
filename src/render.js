const Meyda = require('meyda');
const { desktopCapturer, Menu, dialog } = require('@electron/remote');

let features = null;
let running = false;
let mediaRecorder;
const recordedChunks = [];



const audioElement = document.getElementById('audio');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

const audioSelectBtn = document.getElementById("audioSelectBtn");
audioSelectBtn.onclick = getAudioSources;


async function getAudioSources() {
    const inputSources = await navigator.mediaDevices.enumerateDevices();
    const audioOptionsMenu = Menu.buildFromTemplate(
        inputSources
        .filter(d => d.kind === 'audioinput')
        .map(source => {
            return {
                label: source.label,
                click: () => selectSource(source)
            };
        })
    );
    audioOptionsMenu.popup();
}


async function selectSource(source) {
    audioSelectBtn.innerText = source.name;
  
    const constraints = { video: false, audio: true };
  
    // Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
  
    // Preview the source in a video element
    audioElement.srcObject = stream;
    console.log('audio input selected');
    console.log(stream);
}












let signal = new Array(32).fill(0).map((element, index) => {
    const remainder = index % 3;
    if (remainder === 0) {
      return 1;
    } else if (remainder === 1) {
      return 0;
    }
    return -1;
});

let a = Meyda.extract("zcr", signal);
console.log(a);












// const startFeatureExtraction = async () => {
//     const featureExtractor =  new FeatureExtractor();
//     features = await featureExtractor.getFeatures(['amplitudeSpectrum', 'spectralCentroid', 'spectralRolloff', 'loudness', 'rms']);
//     running = true;
//     if (features) {
//         // sendFeatures();
//         console.log(features);
//     }
// }

// // const sendFeatures = () => {
// //     while (running) {
// //         setInterval(() => {
// //             socket.emit('stream', features)
// //         }, 5000);
// //     }
// // }

// class FeatureExtractor {
//     constructor(bufferSize = 1024) {
//         // List of features to extract
//         this.features = [
//             'buffer',
//             'rms',
//             'energy',
//             'complexSpectrum',
//             'spectralSlope',
//             'spectralCentroid',
//             'spectralRolloff',
//             'spectralFlatness',
//             'spectralSpread',
//             'spectralSkewness',
//             'spectralKurtosis',
//             'amplitudeSpectrum',
//             'zcr',
//             'loudness',
//             'perceptualSpread',
//             'perceptualSharpness',
//             'powerSpectrum',
//             'mfcc',
//             'chroma'
//         ];

//         // Start audiocontext
//         try {
//             this.context = new (window.AudioContext || window.webkitAudioContext)();
//         } catch (err) {
//             console.log(err);
//         };

//         // Get user audio from mic -> audio source node -> meyda
//         this.#initializeAudioStream(bufferSize);
//     }


//     #initializeAudioStream(bufferSize) {
//         const errorCallback = err => {
//             console.log(err);
//             if (this.context.state === 'suspended') {
//                 this.context.resume();
//             }
//         }

//         // Get user mic input -> stream
//         try {
//             const constraints = { video: false, audio: true };

//             navigator.mediaDevices.getUserMedia(constraints)
//             .then(stream => {
//                 console.log('Mic access allowed.');
//                 console.log('Initialize audio node from media stream.');

//                 // Set stream as source for audio source node
//                 const source = this.context.createMediaStreamSource(stream);

//                 // Set up Meyda analyzer
//                 if (typeof Meyda === 'undefined') {
//                     console.log('Meyda not found.');
//                 } else {
//                     this.meyda =  Meyda.createMeydaAnalyzer({
//                         audioContext: this.context,
//                         source: source,
//                         input: 1,
//                         bufferSize: bufferSize,
//                         hopSize: (bufferSize / 2),
//                         sampleRate: 44100,
//                         windowingFunction: 'hanning',
//                         numberOfMFCCCoefficients: 20,
//                         startImmediately: true,
//                         // featureExtractors: this.features
//                     });
//                     this.meyda.start();
//                     console.log('Meyda started.');
//                 }
                
//                 console.groupEnd();
//             }).catch(errorCallback);
//         } catch (err) {
//             errorCallback(err);
//         }
//     }


//     async getFeatures(features = this.features) {
//         // Extract feature
//         this.context.resume();
//         return this.meyda.get(features);
//     }
// }

// startBtn.onclick = startFeatureExtraction;
