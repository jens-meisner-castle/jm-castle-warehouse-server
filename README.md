# Your home is your castle

This project contains the jm-castle-warehouse-server:

## Updates

### Version 1.2

Add a backup folder to your configuration file (on the top level):

```json
{
  "imageStore": { "...": "..." },
  "systemBackupStore": {
    "type": "file-system",
    "path": "c:/castle-live/castle-warehouse-backup"
  }
}
```

Add a folder for temporary files to your configuration file (on the top level):

```json
{
  "imageStore": { "...": "..." },
  "tempStore": {
    "type": "file-system",
    "path": "c:/castle-live/castle-warehouse-temp"
  }
}
```
