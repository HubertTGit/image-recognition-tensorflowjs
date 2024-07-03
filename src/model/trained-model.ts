import { layers, sequential } from '@tensorflow/tfjs';

export const trainedModel = (classificationsLength: number) => {
  const model = sequential();

  // Add the first hidden layer.
  model.add(
    layers.dense({ inputShape: [1024], units: 128, activation: 'relu' })
  );

  //softmax is a common activation for classification problems.
  model.add(
    layers.dense({ units: classificationsLength, activation: 'softmax' })
  );

  //model.summary();

  // Compile the model with the defined optimizer and specify a loss function to use.
  model.compile({
    // Adam changes the learning rate over time which is useful.
    optimizer: 'adam',
    // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
    // Else categoricalCrossentropy is used if more than 2 classes.
    loss:
      classificationsLength === 2
        ? 'binaryCrossentropy'
        : 'categoricalCrossentropy',
    // As this is a classification problem you can record accuracy in the logs too!
    metrics: ['accuracy'],
  });

  return model;
};
