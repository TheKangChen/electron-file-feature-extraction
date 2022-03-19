const { Menu, dialog } = require('@electron/remote');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const wav = require('node-wav');
const Meyda = require('meyda');


const debug = true;

let featuresList = [
    'rms',
    'zcr',
    'spectralRolloff',
    'spectralCentroid',
    'spectralSpread',
    'spectralSkewness',
    'spectralKurtosis',
    'spectralFlatness',
    'mfcc',
    'chroma',
    'loudness',
    'energy',
    'perceptualSharpness',
    'spectralSlope'
];

const finalFeatureSet = [
    'rms_mean',
    'rms_std',
    'zerocross_mean',
    'zerocross_std',
    'rolloff_mean',
    'rolloff_std',
    'centroid_mean',
    'centroid_std',
    'spread_mean',
    'spread_std',
    'skewness_mean',
    'skewness_std',
    'kurtosis_mean',
    'kurtosis_std',
    'flatness_mean',
    'flatness_std',
    'mfcc_mean_1',
    'mfcc_mean_2',
    'mfcc_mean_3',
    'mfcc_mean_4',
    'mfcc_mean_5',
    'mfcc_mean_6',
    'mfcc_mean_7',
    'mfcc_mean_8',
    'mfcc_mean_9',
    'mfcc_mean_10',
    'mfcc_mean_11',
    'mfcc_mean_12',
    'mfcc_mean_13',
    'mfcc_std_1',
    'mfcc_std_2',
    'mfcc_std_3',
    'mfcc_std_4',
    'mfcc_std_5',
    'mfcc_std_6',
    'mfcc_std_7',
    'mfcc_std_8',
    'mfcc_std_9',
    'mfcc_std_10',
    'mfcc_std_11',
    'mfcc_std_12',
    'mfcc_std_13',
    'chromagram_mean_1',
    'chromagram_mean_2',
    'chromagram_mean_3',
    'chromagram_mean_4',
    'chromagram_mean_5',
    'chromagram_mean_6',
    'chromagram_mean_7',
    'chromagram_mean_8',
    'chromagram_mean_9',
    'chromagram_mean_10',
    'chromagram_mean_11',
    'chromagram_mean_12',
    'chromagram_std_1',
    'chromagram_std_2',
    'chromagram_std_3',
    'chromagram_std_4',
    'chromagram_std_5',
    'chromagram_std_6',
    'chromagram_std_7',
    'chromagram_std_8',
    'chromagram_std_9',
    'chromagram_std_10',
    'chromagram_std_11',
    'chromagram_std_12',
    'loudness_mean',
    'loudness_std',
    'energy_mean',
    'energy_std',
    'perceptual_sharp_mean',
    'perceptual_sharp_std',
    'spectral_slope_mean',
    'spectral_slope_std'
];

let fileBuffer; // audio file buffer
let audioData; // audio file data
let signal; // audio signal from audio data

let featureContainer = []; // Container for all feature
// let featureStats; // mean & std of features

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

const fileBtn = document.getElementById("fileBtn");
fileBtn.onclick = getAudiofile;

const saveBtn = document.getElementById("saveBtn");
saveBtn.onclick = saveAsCSV;


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

        if (debug) {
            console.log(file);
            console.log(canceled);
        }

        fileBuffer = fs.readFileSync(file[0]);
        audioElement.src = file;
        audioData = wav.decode(fileBuffer);
        signal = audioData.channelData[0];
    } catch (err) {
        console.log(err);
  }
}


// get features
async function getFeatures() {
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

    for (let i=0; i<sigLen; i+=bufferSize) {
        const currentSig = paddedSig.subarray(i, i+bufferSize)
        let extractedFeatures = Meyda.extract(featuresList, currentSig);
        featureContainer.push(extractedFeatures);

        debug ? console.log(extractedFeatures) : '';
    }
    if (debug) {
        console.log(featureContainer);
        console.log(featureContainer.length);
    }
}


// get Mean & Std of features
function getStats(featureContainer) {
    if (!Array.isArray(featureContainer)) {
        throw 'Cannot get stats, getStats() parameter 0 not an array';
    }
    const len = featureContainer.length;
    const n = finalFeatureSet.length;
    debug ? console.log(len, n) : '';

    // Put features into their corresponding array
    let stats = [];
    let featureSet = {
        rms: [],
        zcr: [],
        rolloff: [],
        centroid: [],
        spread: [],
        skewness: [],
        kurtosis: [],
        flatness: [],
        mfcc1: [],
        mfcc2: [],
        mfcc3: [],
        mfcc4: [],
        mfcc5: [],
        mfcc6: [],
        mfcc7: [],
        mfcc8: [],
        mfcc9: [],
        mfcc10: [],
        mfcc11: [],
        mfcc12: [],
        mfcc13: [],
        chroma1: [],
        chroma2: [],
        chroma3: [],
        chroma4: [],
        chroma5: [],
        chroma6: [],
        chroma7: [],
        chroma8: [],
        chroma9: [],
        chroma10: [],
        chroma11: [],
        chroma12: [],
        loudness: [],
        energy: [],
        sharpness: [],
        spectSlope: [],
    } // 37

    featureContainer.forEach(e => {
        featureSet.rms.push(e.rms);
        featureSet.zcr.push(e.zcr);
        featureSet.rolloff.push(e.spectralRolloff);
        featureSet.centroid.push(e.spectralCentroid);
        featureSet.spread.push(e.spectralSpread);
        featureSet.skewness.push(e.spectralSkewness);
        featureSet.kurtosis.push(e.spectralKurtosis);
        featureSet.flatness.push(e.spectralFlatness);
        featureSet.mfcc1.push(e.mfcc[0]);
        featureSet.mfcc2.push(e.mfcc[1]);
        featureSet.mfcc3.push(e.mfcc[2]);
        featureSet.mfcc4.push(e.mfcc[3]);
        featureSet.mfcc5.push(e.mfcc[4]);
        featureSet.mfcc6.push(e.mfcc[5]);
        featureSet.mfcc7.push(e.mfcc[6]);
        featureSet.mfcc8.push(e.mfcc[7]);
        featureSet.mfcc9.push(e.mfcc[8]);
        featureSet.mfcc10.push(e.mfcc[9]);
        featureSet.mfcc11.push(e.mfcc[10]);
        featureSet.mfcc12.push(e.mfcc[11]);
        featureSet.mfcc13.push(e.mfcc[12]);
        featureSet.chroma1.push(e.chroma[0]);
        featureSet.chroma2.push(e.chroma[1]);
        featureSet.chroma3.push(e.chroma[2]);
        featureSet.chroma4.push(e.chroma[3]);
        featureSet.chroma5.push(e.chroma[4]);
        featureSet.chroma6.push(e.chroma[5]);
        featureSet.chroma7.push(e.chroma[6]);
        featureSet.chroma8.push(e.chroma[7]);
        featureSet.chroma9.push(e.chroma[8]);
        featureSet.chroma10.push(e.chroma[9]);
        featureSet.chroma11.push(e.chroma[10]);
        featureSet.chroma12.push(e.chroma[11]);
        featureSet.loudness.push(e.loudness.total / 24);
        featureSet.energy.push(e.energy);
        featureSet.sharpness.push(e.perceptualSharpness);
        featureSet.spectSlope.push(e.spectralSlope);
    })
    debug ? console.log(featureSet) : '';
    
    // Get mean and std of each feature
    for (let i=0; i<n/2; ++i) {
        stats.push(mean(featureSet[Object.keys(featureSet)[i]]));
        stats.push(std(featureSet[Object.keys(featureSet)[i]]));
    }
    debug ? console.log(stats) : '';
    
    // Return array of feature statistics as Float32Array
    return new Float32Array(stats)
}


// save feature stats for the file
function saveAsCSV() {
    const featureStats = getStats(featureContainer);
    debug ? console.log(featureStats.length) : '';

    if (featureStats) {
        ;
    }
}


/************* Math Calculations *************/

// Check if number is the power of 2
function isPowerOf2(v) {
    return v && !(v & (v - 1));
}


// Mean of an array
function mean(a) {
    if (!Array.isArray(a)) throw 'mean() parameter 0 not an array';
    let n = a.length;
    if (n === 0) return 0;
    return (a.reduce((prev, curr) => prev + curr) / n);
}


// Standard Deviation of an array
function std(a) {
    if (!Array.isArray(a)) throw 'std() parameter 0 not an array';
    const n = a.length;
    if (n === 0) return 0;
    const m = a.reduce((prev, curr) => prev + curr) / n;
    return Math.sqrt(a.map(x => Math.pow(x - m, 2)).reduce((prev, curr) => prev + curr) / n);
}
