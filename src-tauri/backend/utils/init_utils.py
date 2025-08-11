import threading
import requests
from constants import Config
from rag_utils import RAGSystem
from voice_utils import VoiceAssistant

class ThreadWithResult(threading.Thread):
    def __init__(self, target, *args, **kwargs):
        super().__init__(daemon=True)
        self._target = target
        self._args = args
        self._kwargs = kwargs
        self.result = None

    def run(self):
        self.result = self._target(*self._args, **self._kwargs)


def init_config():
    return Config()


def init_http_session():
    return requests.Session()


def init_rag_system(config):
    return RAGSystem(config)


def init_client():
    return VoiceAssistant()


def init_config_threaded():
    t = ThreadWithResult(init_config)
    t.start()
    return t


def init_http_session_threaded():
    t = ThreadWithResult(init_http_session)
    t.start()
    return t

def init_rag_system_threaded(config):
    t = ThreadWithResult(init_rag_system, config)
    t.start()
    return t

def init_client_threaded():
    t = ThreadWithResult(init_client)
    t.start()
    return t
