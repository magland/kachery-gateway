import os
import json
from typing import Any, Dict, List
import time
import datetime

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

def main():
    base_log_dir = 'logs'

    log_items = []

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
    
    total_client_usage: Dict[str, Any] = {}
    client_usage_by_day_dict: Dict[str, Dict[str, Any]] = {}
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

            if client_id not in clients:
                clients[client_id] = Client({'clientId': client_id, 'label': '', 'ownerId': '', 'timestampCreated': 0})

            date = datetime.datetime.fromtimestamp(timestamp / 1000)
            date_str = f'{date.year}.{date.month}.{date.day}'
            if date_str not in client_usage_by_day_dict:
                client_usage_by_day_dict[date_str] = {}
            
            if client_id not in client_usage_by_day_dict[date_str]:
                client_usage_by_day_dict[date_str][client_id] = {'count': 0, 'size': 0, 'ownerId': clients[client_id].owner_id}
            client_usage_by_day_dict[date_str][client_id]['count'] += 1
            client_usage_by_day_dict[date_str][client_id]['size'] += size
            if True:
                if client_id not in total_client_usage:
                    total_client_usage[client_id] = {'count': 0, 'size': 0, 'ownerId': clients[client_id].owner_id}
                total_client_usage[client_id]['count'] += 1
                total_client_usage[client_id]['size'] += size

    date_strings = sorted(list(client_usage_by_day_dict.keys()))
    daily_usage = []
    for date_string in date_strings:
        daily_usage.append({
            'date': date_string,
            'clientUsage': client_usage_by_day_dict[date_string]
        })
    total_usage = {
        'clientUsage': total_client_usage
    }

    for uu in daily_usage:
        print('')
        print(f'====================== {uu["date"]}')
        client_usage = uu['clientUsage']
        for client in clients.values():
            if client.client_id in client_usage:
                count = client_usage[client.client_id]['count']
                size = client_usage[client.client_id]['size']
                print(f'{client.client_id[:6]}... {client.owner_id} {count} {size}')
    
    print('')
    print('====================== total')
    for client in clients.values():
        if client.client_id in total_client_usage:
            count = total_client_usage[client.client_id]['count']
            size = total_client_usage[client.client_id]['size']
            print(f'{client.client_id[:6]}... {client.owner_id} {count} {size}')
    
    usage = {
        'timestamp': int(time.time() * 1000),
        'dailyUsage': daily_usage,
        'totalUsage': total_usage
    }

    with open('usage.json', 'w') as f:
        json.dump(usage, f)
    
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