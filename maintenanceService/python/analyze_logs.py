import os
import json
from typing import Dict, List
import numpy as np
import time

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

class FileManager:
    def __init__(self) -> None:
        self._files: Dict[str, File] = {}
    def add_file(self, *, uri: str, size: int):
        if uri in self._files:
            return
        self._files[uri] = File(uri=uri, size=size)

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
            pass
        elif type0 == 'initiateFileUpload':
            pass
        elif type0 == 'finalizeFileUpload':
            payload = request['payload']
            hashalg = payload['hashAlg']
            hash = payload['hash']
            size = payload['size']
            uri = f'{hashalg}://{hash}'
            self.file_manager.add_file(uri=uri, size=size)
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
        elif type0 == 'getRecentActivity':
            pass
        else:
            print(type0)

def main():
    base_log_dir = '../logs'

    log_items = []

    # X = LogAnalyzer()
    files = os.listdir(base_log_dir)
    for a in files:
        if a.startswith('log-') and a.endswith('.json'):
            fname = f'{base_log_dir}/{a}'
            with open(fname) as f:
                x = json.load(f)
                for item in x:
                    log_items.append(item)
    
    clients: Dict[str, Client] = {}
    for item in log_items:
        request = item['request']
        type0 = request['type'] if 'type' in request else request['payload']['type']
        if type0 == 'addClient':
            client = Client({**request, 'timestampCreated': item['requestTimestamp']})
            clients[client.client_id] = client
        elif type0 == 'deleteClient':
            client_id = request['clientId']
            if client_id in clients:
                clients[client_id].deleted = True
        elif type0 == 'setClientInfo':
            pass
        elif type0 == 'migrateClient':
            client = Client(request['client'])
            clients[client.client_id] = client
    
    all_elapsed = []
    recent_file_counts: Dict[str, Any] = {}
    for item in log_items:
        request = item['request']
        type0 = request['type'] if 'type' in request else request['payload']['type']
        if type0 == 'finalizeFileUpload':
            client_id = request['fromClientId']
            payload = request['payload']
            hashalg = payload['hashAlg']
            hash = payload['hash']
            size = payload['size']
            timestamp = payload['timestamp']
            # uri = f'{hashalg}://{hash}'
            elapsed = time.time() - (timestamp / 1000)
            all_elapsed.append(elapsed)
            if elapsed < 24 * 60 * 60:
                if client_id not in recent_file_counts:
                    if client_id not in clients:
                        clients[client_id] = Client({'clientId': client_id, 'label': '', 'ownerId': '', 'timestampCreated': 0})
                    recent_file_counts[client_id] = {'count': 0, 'size': 0}
                recent_file_counts[client_id]['count'] += 1
                recent_file_counts[client_id]['size'] += size

    print(recent_file_counts)

    for client in clients.values():
        if client.client_id in recent_file_counts:
            count = recent_file_counts[client.client_id]['count']
            size = recent_file_counts[client.client_id]['size']
            print(f'{client.client_id[:6]}... {client.owner_id} {count} {size}')
    
    print(np.min(all_elapsed))

    # for client in X.client_manager._clients:
    #     print(f'{"DELETED        " if client.deleted else ""}{client.client_id[:6]} {client.owner_id} {client.label}')
    
    # files_count = 0
    # file_sizes: List[int] = []
    # for uri, f in X.file_manager._files.items():
    #     files_count += 1
    #     file_sizes.append(f.size)

    # print(f'Num. files: {files_count}')

    # mean_size = np.mean(file_sizes)
    # median_size = np.median(file_sizes)
    # max_size = np.max(file_sizes)
    # total_size = np.sum(file_sizes)

    # print(f'Mean file size: {mean_size / 1e6} MiB')
    # print(f'Median file size: {median_size / 1e6} MiB')
    # print(f'Max file size: {max_size / 1e6} MiB')
    # print(f'Total size: {total_size / 1e9} GiB')


if __name__ == '__main__':
    main()