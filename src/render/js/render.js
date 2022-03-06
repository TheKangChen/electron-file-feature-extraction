const { Menu, dialog } = require('@electron/remote');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const wav = require('node-wav');
const Meyda = require('meyda');


let featuresList = [
    'buffer',
    'rms',
    'energy',
    'complexSpectrum',
    'spectralSlope',
    'spectralCentroid',
    'spectralRolloff',
    'spectralFlatness',
    'spectralSpread',
    'spectralSkewness',
    'spectralKurtosis',
    'amplitudeSpectrum',
    'zcr',
    'loudness',
    'perceptualSpread',
    'perceptualSharpness',
    'powerSpectrum',
    'mfcc',
    'chroma',
    // 'spectralFlux'
];

let fileBuffer; // audio file buffer
let audioData; // audio file data
let signal;

// audio metadata
const sampleRate = 44100;
const bufferSize = 1024;
const hopSize = bufferSize / 2;
const windowingFunction = 'hanning';
const n_mfcc = 13;


// Select HTML elements
const audioElement = document.getElementById('audio');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = getFeatures;

const stopBtn = document.getElementById('stopBtn');

const audioSelectBtn = document.getElementById("audioSelectBtn");
audioSelectBtn.onclick = getAudioSources;

const fileBtn = document.getElementById("file");
fileBtn.onclick = getAudiofile;


/*********************************************************************/


// get audio file
async function getAudiofile() {
    try {
        const selectedFile = await dialog.showOpenDialog({
        properties: ['openFile', 'openDirectory'],
        filters: [
            {
                name: 'Audios',
                extensions: ['wav']
            }
        ]
        });

        const file = selectedFile.filePaths;
        const canceled = selectedFile.canceled;

        console.log(file);

        fileBuffer = fs.readFileSync(file[0]);
        audioElement.src = file;

        // node-wav
        audioData = wav.decode(fileBuffer);
        signal = audioData.channelData[0];
    } catch (err) {
        console.log(err);
  }
}


// setup Meyda audio analyzer with webauio api
async function startAnalyzer() {
    // config Meyda
    Meyda.sampleRate = sampleRate;
    Meyda.windowingFunction = windowingFunction;
    Meyda.numberOfMFCCCoefficients = n_mfcc;

    // check if signal length is the power of 2
    let paddedSig;
    if (!isPowerOf2(signal.length)) {
        const len = signal.length;
        const targetPower = Math.ceil(Math.log2(len));
        const newLen = Math.pow(2, targetPower);
        const truncLen = Math.pow(2, (targetPower - 1));

        if ((newLen - len) < (len - truncLen)) {
            const padLen = newLen - len;
            const zeros = new Float32Array(padLen);

            paddedSig = new Float32Array(newLen);
            paddedSig.set(signal);
            paddedSig.set(zeros, len);
        } else {
            paddedSig = signal.subarray(0, truncLen);
        }
    } else {
        paddedSig = signal;
    }
    // extract through signal
    const sigLen = paddedSig.length;

    let i = 0;
    let interval = setInterval(() => {
        if (i < sigLen) {
            const currentSig = paddedSig.subarray(i, i+bufferSize)
            let extractedFeatures = Meyda.extract(featuresList, currentSig);
            console.log(extractedFeatures);
            i+= bufferSize;
        } else {
            clearInterval(interval);
        }
    }, 23.2);
}


// get features
async function getFeatures() {
    startAnalyzer();
}


// Get Mic Audio Input
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
  
    const constraints = {
        video: false,
        audio: {
            sampleRate: 44100,
            channelCount: 1
        }
    };
  
    // Create a Stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
  
    // Preview the source in a video element
    audioElement.srcObject = stream;
    console.log('audio input selected');
    console.log(stream);
}


function isPowerOf2(v) {
    return v && !(v & (v - 1));
}
