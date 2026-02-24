import Migration "migration";
import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  type RecordType = {
    #CBC;
    #LFT;
    #Cholesterol;
    #BloodSugar;
    #BloodPressure;
    #GeneralAilments;
  };

  type MedicalRecord = {
    recordDate : Int;
    recordType : RecordType;
    recordId : Text;
    data : Text;
  };

  module MedicalRecord {
    public func compare(a : MedicalRecord, b : MedicalRecord) : Order.Order {
      if (Int.less(a.recordDate, b.recordDate)) {
        #less;
      } else if (Int.less(b.recordDate, a.recordDate)) {
        #greater;
      } else {
        Text.compare(a.recordId, b.recordId);
      };
    };
  };

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  let users = Map.empty<Principal, Map.Map<Text, MedicalRecord>>();
  let temporaryFiles = Map.empty<Principal, Map.Map<Text, Storage.ExternalBlob>>();
  let uploadedFiles = Map.empty<Text, Storage.ExternalBlob>();

  func getUser(caller : Principal) : Map.Map<Text, MedicalRecord> {
    let empty = Map.empty<Text, MedicalRecord>();
    switch (users.get(caller)) {
      case (null) { empty };
      case (?user) { user };
    };
  };

  func updateUser(caller : Principal, records : Map.Map<Text, MedicalRecord>) {
    users.add(caller, records);
  };

  func requireUser(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access medical records");
    };
  };

  // User profile functions

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // Medical record functions

  public query ({ caller }) func hasMedicalRecordAccess() : async Bool {
    requireUser(caller);
    true;
  };

  public shared ({ caller }) func addMedicalRecord(recordId : Text, recordDate : Int, recordType : RecordType, data : Text) : async () {
    requireUser(caller);

    let record : MedicalRecord = {
      recordDate;
      recordType;
      recordId;
      data;
    };

    let user = getUser(caller);
    user.add(recordId, record);
    updateUser(caller, user);
  };

  public shared ({ caller }) func deleteMedicalRecord(recordId : Text) : async () {
    requireUser(caller);

    let user = getUser(caller);
    switch (user.get(recordId)) {
      case (null) { Runtime.trap("Record does not exist.") };
      case (?_) {
        user.remove(recordId);
        updateUser(caller, user);
      };
    };
  };

  public query ({ caller }) func getMedicalRecord(recordId : Text) : async MedicalRecord {
    requireUser(caller);

    let user = getUser(caller);
    switch (user.get(recordId)) {
      case (null) { Runtime.trap("Record does not exist.") };
      case (?record) { record };
    };
  };

  public query ({ caller }) func getAllRecords() : async [MedicalRecord] {
    requireUser(caller);

    let records = getUser(caller).values().toArray();
    records.sort();
  };

  public query ({ caller }) func getRecordsByType(recordType : RecordType) : async [MedicalRecord] {
    requireUser(caller);

    let filtered = List.empty<MedicalRecord>();

    for ((_, record) in getUser(caller).entries()) {
      if (record.recordType == recordType) {
        filtered.add(record);
      };
    };

    filtered.toArray();
  };

  public query ({ caller }) func recordExists(recordId : Text) : async Bool {
    requireUser(caller);

    getUser(caller).containsKey(recordId);
  };

  public query ({ caller }) func listUploadedFiles() : async [(Text, Storage.ExternalBlob)] {
    requireUser(caller);

    let files = Map.empty<Text, Storage.ExternalBlob>();

    // Add temporary files
    switch (temporaryFiles.get(caller)) {
      case (?tempFileMap) {
        for ((fileId, blob) in tempFileMap.entries()) {
          files.add(fileId, blob);
        };
      };
      case (null) {};
    };

    // Add permanent files
    for ((fileId, blob) in uploadedFiles.entries()) {
      files.add(fileId, blob);
    };

    files.toArray();
  };

  public shared ({ caller }) func deleteUploadedFile(fileId : Text, isTemporary : Bool) : async () {
    requireUser(caller);

    switch (isTemporary) {
      case (true) {
        switch (temporaryFiles.get(caller)) {
          case (?tempFiles) {
            tempFiles.remove(fileId);
            if (tempFiles.isEmpty()) {
              temporaryFiles.remove(caller);
            };
          };
          case (null) { Runtime.trap("Temporary file not found") };
        };
      };
      case (false) {
        uploadedFiles.remove(fileId);
      };
    };
  };

  public shared ({ caller }) func uploadFileAndGetReference(blob : Storage.ExternalBlob, fileId : Text, isTemporary : Bool) : async Text {
    requireUser(caller);

    if (isTemporary) {
      // Handle temporary files
      let newTempFileMap = switch (temporaryFiles.get(caller)) {
        case (null) {
          let map = Map.empty<Text, Storage.ExternalBlob>();
          map.add(fileId, blob);
          map;
        };
        case (?existing) {
          existing.add(fileId, blob);
          existing;
        };
      };

      temporaryFiles.add(caller, newTempFileMap);
    } else {
      // Add permanent file
      uploadedFiles.add(fileId, blob);
    };

    fileId;
  };
};
