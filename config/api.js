var api = [
  {
    'endpoint': '/system/list/',
    'method': 'GET',
    'params': [],
    'response': 'json',
    'example': '',
    'description': 'List existent translations systems.'
  },
  {
    'method': 'POST',
    'endpoint': '/system/upload/',
    'params': [],
    'response': 'json',
    'description': 'Upload a new translation system. Expects .json file with the following fields:',
    'example': '--form \'translationSystem=@description.json\''
  },
  {
    'method': 'GET',
    'endpoint': '/test/list/',
    'params': ['src', 'tgt'],
    'esponse': 'json',
    'example': '',
    'description': 'List test files for a given language pair.'
  },
  {
    'method': 'GET',
    'endpoint': '/test/download/',
    'params': ['fileId'],
    'response': 'file',
    'example': '',
    'description': 'Download test file with specified id.'
  },
  {
    'method': 'GET',
    'endpoint': '/output/list/',
    'params': ['systemId'],
    'response': 'json',
    'example': '',
    'description': 'List output files for a given system.'
  },
  {
    'method': 'POST',
    'endpoint': '/output/upload/',
    'params': ['fileId, systemId', 'outputFile'],
    'response': 'json',
    'example': '--form \'outputFile=@tranlsation.output\' --form systemId={systemId} --form fileId={fileId}',
    'description': 'Upload a translation output. Test file and translation system ids must be specified.'
  }
];

exports.api = api;
