var systemDescription = [
  {
    "name": "systemName",
    "default": "",
    "placeholder": "ORG-xxyy-dd/mm/yyyy",
    "type": "text",
    "label": "System name",
    "required": true,
    "layer": 1
  },
  {
    "name": "constraint",
    "default": "",
    "placeholder": "",
    "type": "radio",
    "label": "Constrainted system",
    "required": true,
    "layer": 1
  },
  {
    "name": "trainSet",
    "default": "",
    "placeholder": "Training set",
    "type": "text/hidden",
    "hidden": true,
    "className": "trainSet",
    "label": "Training data set",
    "required": true,
    "layer": 1
  },
  {
    "name": "framework",
    "default": "",
    "placeholder": "OpenNMT",
    "type": "text",
    "label": "Framework",
    "required": true,
    "layer": 1
  },
  {
    "name": "version",
    "default": "",
    "placeholder": "",
    "type": "text",
    "label": "Framework version",
    "required": true,
    "layer": 1
  },
  {
    "name": "user",
    "default": "",
    "placeholder": "",
    "type": "user",
    "label": "Author",
    "required": true,
    "layer": 1
  },
  {
    "name": "sourceLanguage",
    "default": "",
    "placeholder": "",
    "type": "dropdown",
    "label": "Source language",
    "required": true,
    "layer": 1
  },
  {
    "name": "targetLanguage",
    "default": "",
    "placeholder": "",
    "type": "dropdown",
    "label": "Target language",
    "required": true,
    "layer": 1
  },
  {
    "name": "type",
    "default": "",
    "placeholder": "",
    "values": ["NMT", "SMT", "Hybrid", "Rulebased"],
    "type": "set",
    "label": "Type",
    "required": true,
    "layer": 1
  },
  {
    "name": "recipe",
    "default": "",
    "placeholder": "",
    "type": "textarea",
    "label": "Recipe",
    "required": true,
    "layer": 0
  },

  {
    "name": "architecture",
    "default": "seq2seq-attn",
    "placeholder": "seq2seq-attn",
    "type": "text",
    "label": "Global NN architecture",
    "required": true,
    "layer": 2
  },
  {
    "name": "features",
    "default": "case",
    "placeholder": "case",
    "type": "text",
    "label": "Use of side features",
    "required": true,
    "layer": 2
  },
  {
    "name": "tokenization",
    "default": "generic+BPE",
    "placeholder": "generic+BPE",
    "type": "text",
    "label": "Tokenization type",
    "required": true,
    "layer": 2
  },
  {
    "name": "vocabulary",
    "default": "50000/50000",
    "placeholder": "50000/50000",
    "type": "text",
    "label": "Vocabulary Size",
    "required": true,
    "layer": 2
  },
  {
    "name": "layers",
    "default": "2x4",
    "placeholder": "2x4",
    "type": "text",
    "label": "Number of layers",
    "required": true,
    "layer": 2
  },
  {
    "name": "rnnType",
    "default": "1000 LSTM",
    "placeholder": "1000 LSTM",
    "type": "text",
    "label": "RNN type",
    "required": true,
    "layer": 2
  },
  {
    "name": "dropout",
    "default": "0.3",
    "placeholder": "0.3",
    "type": "text",
    "label": "Dropout",
    "required": true,
    "layer": 2
  },
  {
    "name": "embedding",
    "default": "600",
    "placeholder": "600",
    "type": "text",
    "label": "Word Embedding",
    "required": true,
    "layer": 2
  },
  {
    "name": "encoder",
    "default": "none",
    "placeholder": "none",
    "type": "text",
    "label": "Encoder specific",
    "required": true,
    "layer": 3
  },
  {
    "name": "decoder",
    "default": "none",
    "placeholder": "none",
    "type": "text",
    "label": "Decoder specific",
    "required": true,
    "layer": 3
  },
  {
    "name": "attention",
    "default": "Global Attention",
    "placeholder": "Global Attention",
    "type": "text",
    "label": "Attention specific",
    "required": true,
    "layer": 3
  },
  {
    "name": "generator",
    "default": "SoftMax",
    "placeholder": "SoftMax",
    "type": "text",
    "label": "Generator",
    "required": true,
    "layer": 3
  },
  {
    "name": "oov",
    "default": "none",
    "placeholder": "none",
    "type": "text",
    "label": "OOV Replacement",
    "required": true,
    "layer": 3
  },
  {
    "name": "optimization",
    "default": "sgd",
    "placeholder": "sgd",
    "type": "text",
    "label": "Optimization",
    "required": true,
    "layer": 3
  },
  {
    "name": "training",
    "default": "13 epochs",
    "placeholder": "13 epochs",
    "type": "text",
    "label": "Training Specific",
    "required": true,
    "layer": 3
  }
];

exports.systemDescription = systemDescription;
