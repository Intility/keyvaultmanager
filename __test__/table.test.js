const table = require('../Common/table');
const { TableClient } = require('@azure/data-tables');

jest.mock('@azure/data-tables');

describe('table', () => {
  const partitionKey = 'secret';
  const rowKey = 'https:__kvname.vault.azure.net_secrets_secretname';
  const entityObject = {
    partitionKey: partitionKey,
    rowKey: rowKey,
    consumer1: 'consumer1uri',
    consumer2: 'consumer2uri',
  };
  const dataObject = {
    consumer1: 'consumer1uri',
    consumer2: 'consumer2uri',
  };
  const mode = 'Replace';
  describe('getEntity', () => {
    it('should return one table entity', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockGetEntity = mockTableClientInstance.getEntity;
      mockGetEntity.mockResolvedValueOnce(entityObject);
      expect.assertions(3);
      await expect(tableClient.getEntity(partitionKey, rowKey)).resolves.toBe(
        entityObject
      );
      expect(mockGetEntity).toHaveBeenCalledWith(partitionKey, rowKey);
      expect(mockGetEntity).toHaveBeenCalledTimes(1);
    });
    it('should throw if error', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockGetEntity = mockTableClientInstance.getEntity;
      mockGetEntity.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        tableClient.getEntity(partitionKey, rowKey)
      ).rejects.toThrow();
    });
  });
  describe('createEntity', () => {
    it('should create a table entity', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockCreateEntity = mockTableClientInstance.createEntity;
      mockCreateEntity.mockResolvedValueOnce(entityObject);
      expect.assertions(3);
      await expect(
        tableClient.createEntity(partitionKey, rowKey, dataObject)
      ).resolves.toBe(entityObject);
      expect(mockCreateEntity).toHaveBeenCalledWith(entityObject);
      expect(mockCreateEntity).toHaveBeenCalledTimes(1);
    });
    it('should throw if error', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockCreateEntity = mockTableClientInstance.createEntity;
      mockCreateEntity.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        tableClient.createEntity(partitionKey, rowKey, dataObject)
      ).rejects.toThrow();
    });
  });
  describe('updateEntity', () => {
    it('should update a table entity', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockUpdateEntity = mockTableClientInstance.updateEntity;
      mockUpdateEntity.mockResolvedValueOnce(entityObject);
      expect.assertions(3);
      await expect(
        tableClient.updateEntity(partitionKey, rowKey, dataObject, mode)
      ).resolves.toBe(entityObject);
      expect(mockUpdateEntity).toHaveBeenCalledWith(entityObject, mode);
      expect(mockUpdateEntity).toHaveBeenCalledTimes(1);
    });
    it('should throw if error', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockUpdateEntity = mockTableClientInstance.updateEntity;
      mockUpdateEntity.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        tableClient.updateEntity(partitionKey, rowKey, dataObject)
      ).rejects.toThrow();
    });
  });
  describe('upsertEntity', () => {
    it('should upsert a table entity', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockUpsertEntity = mockTableClientInstance.upsertEntity;
      mockUpsertEntity.mockResolvedValueOnce(entityObject);
      expect.assertions(3);
      await expect(
        tableClient.upsertEntity(partitionKey, rowKey, dataObject, mode)
      ).resolves.toBe(entityObject);
      expect(mockUpsertEntity).toHaveBeenCalledWith(entityObject, mode);
      expect(mockUpsertEntity).toHaveBeenCalledTimes(1);
    });
    it('should throw if error', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockUpsertEntity = mockTableClientInstance.upsertEntity;
      mockUpsertEntity.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        tableClient.upsertEntity(partitionKey, rowKey, dataObject)
      ).rejects.toThrow();
    });
  });
  describe('deleteEntity', () => {
    it('should delete a table entity', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockDeleteEntity = mockTableClientInstance.deleteEntity;
      mockDeleteEntity.mockResolvedValueOnce(entityObject);
      expect.assertions(3);
      await expect(
        tableClient.deleteEntity(partitionKey, rowKey)
      ).resolves.toBe(entityObject);
      expect(mockDeleteEntity).toHaveBeenCalledWith(partitionKey, rowKey);
      expect(mockDeleteEntity).toHaveBeenCalledTimes(1);
    });
    it('should throw if error', async () => {
      const tableClient = new table();
      const mockTableClientInstance = TableClient.mock.instances[0];
      const mockDeleteEntity = mockTableClientInstance.deleteEntity;
      mockDeleteEntity.mockRejectedValueOnce(new Error('Async error'));
      expect.assertions(1);
      await expect(
        tableClient.deleteEntity(partitionKey, rowKey)
      ).rejects.toThrow();
    });
  });
});
