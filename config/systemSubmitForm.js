var systemDescription = [
  {
    'name': 'systemName',
    'default': '',
    'placeholder': 'ORG-xxyy-dd/mm/yyyy',
    'type': 'text',
    'label': 'System name',
    'required': true,
    'layer': 1,
    'description': 'A comprehensive system name. We recommend to include the language pair and the date in it.'
  },
  {
    'name': 'constraint',
    'default': '',
    'placeholder': '',
    'type': 'radio',
    'label': 'Constrainted system',
    'required': false,
    'layer': 1,
    'description': 'A constrainted system is trained with an internal training set. Either constraint or trainSet fields should be provided.'
  },
  {
    'name': 'trainSet',
    'default': '',
    'placeholder': 'Training set',
    'type': 'text/hidden',
    'hidden': true,
    'className': 'trainSet',
    'label': 'Training data set',
    'required': false,
    'layer': 1,
    'description': 'Information about training data used for this translation system.'
  },
  {
    'name': 'framework',
    'default': '',
    'placeholder': 'OpenNMT',
    'type': 'text',
    'label': 'Framework',
    'required': false,
    'layer': 1
  },
  {
    'name': 'version',
    'default': '',
    'placeholder': '',
    'type': 'text',
    'label': 'Framework version',
    'required': false,
    'layer': 1
  },
  {
    'name': 'user',
    'default': '',
    'placeholder': '',
    'type': 'user',
    'label': 'Author',
    'required': false,
    'layer': 1
  },
  {
    'name': 'sourceLanguage',
    'default': '',
    'placeholder': '',
    'type': 'language',
    'label': 'Source language',
    'required': true,
    'layer': 1,
    'description': 'ISO 638-1 language code, e.g. "en" for English.'
  },
  {
    'name': 'targetLanguage',
    'default': '',
    'placeholder': '',
    'type': 'language',
    'label': 'Target language',
    'required': true,
    'layer': 1,
    'description': 'ISO 638-1 language code.'
  },
  {
    'name': 'type',
    'default': '',
    'placeholder': '',
    'values': ['NMT', 'SMT', 'Hybrid', 'Rulebased'],
    'type': 'dropdown',
    'label': 'Type',
    'required': true,
    'layer': 1,
    'description': 'NMT, SMT, Hybrid or Rulebased.'
  },
  {
    'name': 'recipe',
    'default': '',
    'placeholder': '',
    'type': 'textarea',
    'label': 'Recipe',
    'required': false,
    'layer': 0
  },

  {
    'name': 'architecture',
    'default': 'seq2seq-attn',
    'placeholder': 'seq2seq-attn',
    'type': 'text',
    'label': 'Global NN architecture',
    'required': false,
    'layer': 2
  },
  {
    'name': 'features',
    'default': 'case',
    'placeholder': 'case',
    'type': 'text',
    'label': 'Use of side features',
    'required': false,
    'layer': 2
  },
  {
    'name': 'tokenization',
    'default': 'generic+BPE',
    'placeholder': 'generic+BPE',
    'type': 'text',
    'label': 'Tokenization type',
    'required': false,
    'layer': 2
  },
  {
    'name': 'vocabulary',
    'default': '50000/50000',
    'placeholder': '50000/50000',
    'type': 'text',
    'label': 'Vocabulary Size',
    'required': false,
    'layer': 2
  },
  {
    'name': 'layers',
    'default': '2x4',
    'placeholder': '2x4',
    'type': 'text',
    'label': 'Number of layers',
    'required': false,
    'layer': 2
  },
  {
    'name': 'rnnType',
    'default': '1000 LSTM',
    'placeholder': '1000 LSTM',
    'type': 'text',
    'label': 'RNN type',
    'required': false,
    'layer': 2
  },
  {
    'name': 'dropout',
    'default': '0.3',
    'placeholder': '0.3',
    'type': 'text',
    'label': 'Dropout',
    'required': false,
    'layer': 2
  },
  {
    'name': 'embedding',
    'default': '600',
    'placeholder': '600',
    'type': 'text',
    'label': 'Word Embedding',
    'required': false,
    'layer': 2,
    'description': 'Word Embedding.'
  },
  {
    'name': 'encoder',
    'default': 'none',
    'placeholder': 'none',
    'type': 'text',
    'label': 'Encoder specific',
    'required': false,
    'layer': 3
  },
  {
    'name': 'decoder',
    'default': 'none',
    'placeholder': 'none',
    'type': 'text',
    'label': 'Decoder specific',
    'required': false,
    'layer': 3
  },
  {
    'name': 'attention',
    'default': 'Global Attention',
    'placeholder': 'Global Attention',
    'type': 'text',
    'label': 'Attention specific',
    'required': false,
    'layer': 3
  },
  {
    'name': 'generator',
    'default': 'SoftMax',
    'placeholder': 'SoftMax',
    'type': 'text',
    'label': 'Generator',
    'required': false,
    'layer': 3
  },
  {
    'name': 'oov',
    'default': 'none',
    'placeholder': 'none',
    'type': 'text',
    'label': 'OOV Replacement',
    'required': false,
    'layer': 3,
    'description': 'Out-Of-Vocabulary words policy.'
  },
  {
    'name': 'optimization',
    'default': 'sgd',
    'placeholder': 'sgd',
    'type': 'text',
    'label': 'Optimization',
    'required': false,
    'layer': 3
  },
  {
    'name': 'training',
    'default': '13 epochs',
    'placeholder': '13 epochs',
    'type': 'text',
    'label': 'Training Specific',
    'required': false,
    'layer': 3,
    'description': 'Number of epochs.'
  }
];

exports.systemDescription = systemDescription;
