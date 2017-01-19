import argparse
import os
from pymongo import MongoClient

def ls_func(opt):
  return

def upload_func(testfiles, opt):
  content_src=''
  content_tgt=''
  with open(opt.src_file, 'r') as myfile:
    content_src=myfile.read()
  with open(opt.tgt_file, 'r') as myfile:
    content_tgt=myfile.read()
  assert testfiles.find_one({'source.fileName': os.path.basename(opt.src_file)}) == None and \
     testfiles.find_one({'target.fileName': os.path.basename(opt.tgt_file)}) == None, "file already in DB"
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

def download_func(opt):
  return

def delete_func(opt):
  return


client = MongoClient()

client = MongoClient('localhost', 27017)

db = client.testdb

testfiles = db.testfiles

parser = argparse.ArgumentParser(description='train.py')
subparsers = parser.add_subparsers(help='sub-command help')

ls_parser = subparsers.add_parser('ls', help='ls help')
ls_parser.set_defaults(func=ls_func)

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

delete_parser = subparsers.add_parser('delete', help='delete help')
delete_parser.set_defaults(func=delete_func)

opt = parser.parse_args()
opt.func(testfiles, opt)


#var testSetSchema = mongoose.Schema({
#  source: {
#    fileName: String,
#    content: String,
#     language: String
#   },
#   target: {
#     fileName: String,
#     content: String,
#     language: String
#   },
#   domain: String,
#   by: String,
#   comment: String,
#   evalTool: String
# });

