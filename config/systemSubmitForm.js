var systemDescription = [
  {
    "name": "systemName",
    "default": "",
    "placeholder": "",
    "type": "text",
    "label": "System name",
    "required": false,
    "layer": 1
  },
  {
    "name": "constraint",
    "default": "",
    "placeholder": "",
    "type": "radio",
    "label": "Constrainted system",
    "required": false,
    "layer": 1
  },
  {
    "name": "version",
    "default": "",
    "placeholder": "",
    "type": "text",
    "label": "Version",
    "required": false,
    "layer": 1
  },
  {
    "name": "user",
    "default": "",
    "placeholder": "",
    "type": "user",
    "label": "Author",
    "required": false,
    "layer": 1
  },
  {
    "name": "sourceLanguage",
    "default": "",
    "placeholder": "",
    "type": "dropdown",
    "label": "Source language",
    "required": false,
    "layer": 1
  },
  {
    "name": "targetLanguage",
    "default": "",
    "placeholder": "",
    "type": "dropdown",
    "label": "Target language",
    "required": false,
    "layer": 1
  },
  {
    "name": "type",
    "default": "",
    "placeholder": "",
    "type": "text",
    "label": "Type",
    "required": false,
    "layer": 1
  },
  {
    "name": "recipe",
    "default": "",
    "placeholder": "",
    "type": "textarea",
    "label": "Recipe",
    "required": false,
    "layer": 1
  },

  {
    "name": "architecture",
    "default": "seq2seq-attn",
    "placeholder": "",
    "type": "text",
    "label": "Global NN architecture",
    "required": false,
    "layer": 2
  },
  {
    "name": "features",
    "default": "case",
    "placeholder": "",
    "type": "text",
    "label": "Use of side features",
    "required": false,
    "layer": 2
  },
  {
    "name": "tokenization",
    "default": "generic+BPE",
    "placeholder": "",
    "type": "text",
    "label": "Tokenization type",
    "required": false,
    "layer": 2
  },
  {
    "name": "vocabulary",
    "default": "50000/50000",
    "placeholder": "",
    "type": "text",
    "label": "Vocabulary Size",
    "required": false,
    "layer": 2
  },
  {
    "name": "layers",
    "default": "2x4",
    "placeholder": "",
    "type": "text",
    "label": "Number of layers",
    "required": false,
    "layer": 2
  },
  {
    "name": "rnnType",
    "default": "1000 LSTM",
    "placeholder": "",
    "type": "text",
    "label": "RNN type",
    "required": false,
    "layer": 2
  },
  {
    "name": "dropout",
    "default": "0.3",
    "placeholder": "",
    "type": "text",
    "label": "Dropout",
    "required": false,
    "layer": 2
  },
  {
    "name": "embedding",
    "default": "600",
    "placeholder": "",
    "type": "text",
    "label": "Word Embedding",
    "required": false,
    "layer": 2
  },
  {
    "name": "encoder",
    "default": "",
    "placeholder": "",
    "type": "text",
    "label": "Encoder specific",
    "required": false,
    "layer": 3
  },
  {
    "name": "decoder",
    "default": "",
    "placeholder": "",
    "type": "text",
    "label": "Decoder specific",
    "required": false,
    "layer": 3
  },
  {
    "name": "attention",
    "default": "Global Attention",
    "placeholder": "",
    "type": "text",
    "label": "Attention specific",
    "required": false,
    "layer": 3
  },
  {
    "name": "generator",
    "default": "SoftMax",
    "placeholder": "",
    "type": "text",
    "label": "Generator",
    "required": false,
    "layer": 3
  },
  {
    "name": "oov",
    "default": "",
    "placeholder": "",
    "type": "text",
    "label": "OOV Replacement",
    "required": false,
    "layer": 3
  },
  {
    "name": "optimization",
    "default": "sgd",
    "placeholder": "",
    "type": "text",
    "label": "Optimization",
    "required": false,
    "layer": 3
  },
  {
    "name": "training",
    "default": "13 epochs",
    "placeholder": "",
    "type": "text",
    "label": "Training Specific",
    "required": false,
    "layer": 3
  }
];

exports.systemDescription = systemDescription;
