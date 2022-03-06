const { Menu, dialog } = require('@electron/remote');
const { ipcRenderer } = require('electron');

const fs = require('fs');
const wav = require('wav');
// const wav = require('node-wav');
const { format } = require('path');


const Meyda = require('meyda');
const extractors = require('meyda/dist/node/featureExtractors');
const meydaUtils = require('meyda/dist/node/utilities');

// import Meyda from 'meyda';


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

let running = false;
let mediaRecorder;
const recordedChunks = [];


let fileName;
let fileBuffer; // audio file buffer
let audioData; // audio file data
let signal;
let source;
let buffer;


let audioContext;
let analyzer;

let audioFeatureExtractor;

// audio metadata
const sampleRate = 44100;
const bufferSize = 1024;
const hopSize = bufferSize / 2;
const windowingFunction = 'hanning';
const n_mfcc = 20;









// // config Meyda
// Meyda.sampleRate = 44100;
// const meyda = Meyda.createMeydaAnalyzer()


// const buffer = new ArrayBuffer(1024);
// let audioData = new Float32Array(buffer);



const audioElement = document.getElementById('audio');

const startBtn = document.getElementById('startBtn');
startBtn.onclick = getFeatures;

const stopBtn = document.getElementById('stopBtn');

const audioSelectBtn = document.getElementById("audioSelectBtn");
audioSelectBtn.onclick = getAudioSources;

const fileBtn = document.getElementById("file");
fileBtn.onclick = getAudiofile;
// () => {

//     // ipcRenderer.send('select-file');
// }




// get audio file
async function getAudiofile() {
    console.log('selecting file');
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
        console.log(`sr: ${audioData.sampleRate}`);

        // fileName = file[0];
        // if (file) return file;

    } catch (err) {
        console.log(err);
  }
}


// setup Meyda audio analyzer with webauio api
async function startAnalyzer() {
    try {
        // start web audio
        audioContext = new (window.AudioContext || window.webkitAudioContext)();


        

        // put audioData into buffer
        source = audioContext.createBufferSource();
        buffer = audioContext.createBuffer(1, sampleRate*6, sampleRate);
        let currentBuffer = buffer.getChannelData(0);



        // // read audio data
        // const fileStream = fs.createReadStream(fileName);
        // const reader = new wav.Reader();

        // reader.on('format', format => {
        //     console.log(format);
        // })
        // fileStream.pipe(reader);
        // audio
        // const stream = new MediaStream();
        // reader.pipe(stream);



        currentBuffer = signal;
        console.log(signal);
        source.buffer = buffer;

        console.log(source);
        console.log(buffer);

        console.log(typeof source);

        // put audioData into stream
        // const source = this.context.createMediaStreamSource(stream);



        // start meyda analyzer
        analyzer = Meyda.createMeydaAnalyzer({
            audioContext: audioContext,
            source: source,
            inputs: 0,
            channel: 0,
            sampleRate: sampleRate,
            windowingFunction: windowingFunction,
            bufferSize: bufferSize,
            hopSize: hopSize,
            numberOfMFCCCoefficients: n_mfcc,
            featureExtractors: featuresList,
            callback: features => {
                console.log(features.rms);
            }
        });
        // source.start();
        analyzer.start();
        console.log('context & analyzer started');
    } catch (err) {
        console.log(err);
    }
}


// get features
async function getFeatures() {
    // const frms = await extractors.rms({
    //     signal: audioData.channelData[0],
    //     bufferSize: bufferSize,
    //     sampleRate: sampleRate
    // });
    // console.log(frms);

    startAnalyzer();
    // console.log(analyzer.extract(['rms']));
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















// let signal = new Array(32).fill(0).map((element, index) => {
//     const remainder = index % 3;
//     if (remainder === 0) {
//       return 1;
//     } else if (remainder === 1) {
//       return 0;
//     }
//     return -1;
// });

// let a = Meyda.extract("zcr", signal);
// console.log(typeof signal);
// // console.log(a);

