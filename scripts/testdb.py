import argparse
import os
import json
import codecs
from pymongo import MongoClient
from bson.objectid import ObjectId

def ls_func(testfiles, opt):
  pattern = {}
  if opt.src:
    pattern['source.language']=opt.src
  if opt.tgt:
    pattern['target.language']=opt.tgt
  c=testfiles.find(pattern, {'source.content':0,'target.content':0})
  for tf in c:
    print str(tf['_id'])+'\t'+tf['source']['language']+'\t'+tf['target']['language']+'\t'+tf['domain']+'\t'+tf['origin']+'\t'+tf['comment']+'\t'+tf['evalTool']
  return

def upload_func(testfiles, opt):
  content_src=''
  content_tgt=''
  with codecs.open(opt.src_file, 'r', 'utf-8') as myfile:
    content_src=myfile.read()
  with codecs.open(opt.tgt_file, 'r', 'utf-8') as myfile:
    content_tgt=myfile.read()
  assert testfiles.find_one({'$and': [{'source.fileName': os.path.basename(opt.src_file)},\
                                    {'source.language': opt.src},{'target.language':opt.tgt}]}) == None or \
         testfiles.find_one({'$and': [{'target.fileName': os.path.basename(opt.tgt_file)},\
                                    {'source.language': opt.src},{'target.language':opt.tgt}]}) == None, "file already in DB"
  testid = testfiles.insert(
    {
      'source':{
        'fileName': os.path.basename(opt.src_file),
        'content': content_src,
        'language': opt.src},
      'target':{
        'fileName': os.path.basename(opt.tgt_file),
        'content': content_tgt,
        'language': opt.tgt},
      'domain': opt.domain,
      'origin': opt.origin,
      'comment': opt.comment,
      'evalTool': opt.evalTool
    })
  return testid

def download_func(testfiles,opt):
  assert os.path.isdir(opt.output_dir), "output_dir should be an existing directory"
  pattern = {}
  if opt.src:
    pattern['source.language']=opt.src
  if opt.tgt:
    pattern['target.language']=opt.tgt
  c=testfiles.find(pattern)
  lps={}
  for tf in c:
    lp=tf['source']['language']+tf['target']['language']
    path=os.path.join(opt.output_dir,lp)
    if not lp in lps:
      assert not os.path.isdir(path), str(path)+" directory already exist - remove it first"
      os.mkdir(path)
    lps[lp]=True
    path=os.path.join(path,tf['domain'])
    if not os.path.isdir(path):
      os.mkdir(path)
    with codecs.open(os.path.join(path,tf['source']['fileName']), 'w', 'utf-8') as myfile:
      myfile.write(tf['source']['content'])
    with codecs.open(os.path.join(path,tf['target']['fileName']), 'w', 'utf-8') as myfile:
      myfile.write(tf['target']['content'])
    tf['source']['content']=None
    tf['target']['content']=None
    tf['_id']=str(tf['_id'])
    with open(os.path.join(path,"README.json"), 'w') as myfile:
      json.dump(tf, myfile, sort_keys=True, indent=4, separators=(',', ': '))
    print "downloading...\t"+str(tf['_id'])+'\t'+tf['source']['language']+'\t'+tf['target']['language']+'\t'+tf['domain']+'\t'+tf['origin']
  return

def delete_func(testfiles,opt):
  testfiles.remove({'_id':ObjectId(opt.id)})
  return


client = MongoClient()

client = MongoClient('localhost', 27017)

db = client.opennmtbenchmark

testfiles = db.testsets

parser = argparse.ArgumentParser(description='train.py')
subparsers = parser.add_subparsers(help='sub-command help')

ls_parser = subparsers.add_parser('ls', help='ls help')
ls_parser.set_defaults(func=ls_func)
ls_parser.add_argument('-src', action='store', help='source language')
ls_parser.add_argument('-tgt', action='store', help='target language')
ls_parser.add_argument('-domain', action='store', help='domain of the test file')

upload_parser = subparsers.add_parser('upload', help='upload help')
upload_parser.set_defaults(func=upload_func)
upload_parser.add_argument('-src', action='store', required=True, help='source language')
upload_parser.add_argument('-tgt', action='store', required=True, help='target language')
upload_parser.add_argument('-src_file', action='store', required=True, help='source file')
upload_parser.add_argument('-tgt_file', action='store', required=True, help='target file')
upload_parser.add_argument('-domain', action='store', help='domain of the test file', default='Generic')
upload_parser.add_argument('-evalTool', action='store', help='eval tool for the test file', required=True, choices=['mteval-13a.pl', 'multi-bleu.pl'])
upload_parser.add_argument('-origin', action='store', help='where the test file comes from', required=True)
upload_parser.add_argument('-comment', action='store', help='description/comment')

download_parser = subparsers.add_parser('download', help='download help')
download_parser.set_defaults(func=download_func)
download_parser.add_argument('-src', action='store', help='source language')
download_parser.add_argument('-tgt', action='store', help='target language')
download_parser.add_argument('-output_dir', action='store', help='output directory where to download selected testfiles', default='.')


delete_parser = subparsers.add_parser('delete', help='delete help')
delete_parser.set_defaults(func=delete_func)
delete_parser.add_argument('-id', action='store', required=True, help='id of the testfile to remove')

opt = parser.parse_args()
opt.func(testfiles, opt)
