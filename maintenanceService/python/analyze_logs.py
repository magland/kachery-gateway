import os
import json
from typing import Dict, List
import numpy as np

class Client:
    def __init__(self, data: dict) -> None:
        self._data = data
        self.client_id = data['clientId']
        self.label = data['label']
        self.owner_id = data['ownerId']
        self.timestamp_created = data['timestampCreated']
        self.deleted = False

class ClientManager:
    def __init__(self) -> None:
        self._clients: List[Client] = []
    def add_client(self, client: Client):
        self._clients.append(client)
    def mark_client_deleted(self, client_id: str):
        for c in self._clients:
            if c.client_id == client_id:
                c.deleted = True

class File:
    def __init__(self, *, uri: str, size: int) -> None:
        self.uri = uri
        self.size = size
        self.find_count = 0

class FileManager:
    def __init__(self) -> None:
        self._files: Dict[str, File] = {}
    def add_file(self, *, uri: str, size: int):
        if uri in self._files:
            return
        self._files[uri] = File(uri=uri, size=size)
    def report_find(self, *, uri: str):
        if uri not in self._files:
            return
        self._files[uri].find_count += 1

class LogAnalyzer:
    def __init__(self) -> None:
        self.client_manager = ClientManager()
        self.file_manager = FileManager()
    def process_log_item(self, item):
        request = item['request']
        type0 = request['type'] if 'type' in request else request['payload']['type']
        if type0 == 'deleteUploadBecauseAlreadyExist':
            type0 = 'deleteUploadBecauseAlreadyExists' # correct typo

        if type0 == 'migrateProjectFile':
            file_record = request['fileRecord']
            uri = f'{file_record["hashAlg"]}://{file_record["hash"]}'
            size = file_record['size']
            self.file_manager.add_file(uri=uri, size=size)
        elif type0 == 'findFile':
            payload = request['payload']
            uri = f'{payload["hashAlg"]}://{payload["hash"]}'
            self.file_manager.report_find(uri=uri)
        elif type0 == 'initiateFileUpload':
            pass
        elif type0 == 'finalizeFileUpload':
            pass
        elif type0 == 'addClient':
            self.client_manager.add_client(Client({**request, 'timestampCreated': item['requestTimestamp']}))
        elif type0 == 'deleteClient':
            self.client_manager.mark_client_deleted(request['clientId'])
        elif type0 == 'setClientInfo':
            pass
        elif type0 == 'migrateClient':
            self.client_manager.add_client(Client(request['client']))
        elif type0 == 'acceptUpload':
            pass
        elif type0 in ['getClients']:
            # ignore
            pass
        elif type0 == 'deleteUploadBecauseAlreadyExists':
            pass
        else:
            print(type0)

def main():
    base_log_dir = '../logs'

    X = LogAnalyzer()
    files = os.listdir(base_log_dir)
    for a in files:
        if a.startswith('log-') and a.endswith('.json'):
            fname = f'{base_log_dir}/{a}'
            with open(fname) as f:
                x = json.load(f)
                for item in x:
                    X.process_log_item(item)
    
    # for client in X.client_manager._clients:
    #     print(f'{"DELETED        " if client.deleted else ""}{client.client_id[:6]} {client.owner_id} {client.label}')
    
    files_count = 0
    files_with_find_count = 0
    file_sizes: List[int] = []
    for uri, f in X.file_manager._files.items():
        files_count += 1
        if f.find_count > 0:
            files_with_find_count += 1
        file_sizes.append(f.size)

    print(f'{files_count}; {files_with_find_count} with find')

    mean_size = np.mean(file_sizes)
    median_size = np.median(file_sizes)
    max_size = np.max(file_sizes)
    total_size = np.sum(file_sizes)

    print(f'Mean file size: {mean_size / 1e6} MiB')
    print(f'Median file size: {median_size / 1e6} MiB')
    print(f'Max file size: {max_size / 1e6} MiB')
    print(f'Total size: {total_size / 1e9} GiB')


if __name__ == '__main__':
    main()