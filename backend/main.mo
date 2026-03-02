import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import List "mo:core/List";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";

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

  public type FamilyMemberProfile = {
    profileId : Text;
    name : Text;
  };

  type AllRecords = {
    personalRecords : Map.Map<Text, MedicalRecord>;
    familyMembers : Map.Map<Text, Map.Map<Text, MedicalRecord>>;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let users = Map.empty<Principal, AllRecords>();
  let temporaryFiles = Map.empty<Principal, Map.Map<Text, Storage.ExternalBlob>>();
  let uploadedFiles = Map.empty<Text, Storage.ExternalBlob>();
  let familyMembers = Map.empty<Principal, Map.Map<Text, FamilyMemberProfile>>();
  let userFiles = Map.empty<Principal, Map.Map<Text, Storage.ExternalBlob>>();

  public type RecordMetadata = {
    fileName : Text;
    uploadTimestamp : Int;
    owner : Principal;
  };

  let recordMetadata = Map.empty<Text, RecordMetadata>();

  func getAllRecordsForUser(caller : Principal) : AllRecords {
    let empty : AllRecords = {
      personalRecords = Map.empty<Text, MedicalRecord>();
      familyMembers = Map.empty<Text, Map.Map<Text, MedicalRecord>>();
    };
    switch (users.get(caller)) {
      case (null) { empty };
      case (?allRecords) { allRecords };
    };
  };

  func updateAllRecordsForUser(caller : Principal, allRecords : AllRecords) {
    users.add(caller, allRecords);
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

  // Family member profile functions

  public shared ({ caller }) func createFamilyMember(name : Text) : async Text {
    requireUser(caller);

    let profileId = name;

    // Add to family member profiles
    let updatedProfiles = switch (familyMembers.get(caller)) {
      case (null) {
        let newMap = Map.empty<Text, FamilyMemberProfile>();
        newMap.add(profileId, { profileId; name });
        newMap;
      };
      case (?profiles) {
        profiles.add(profileId, { profileId; name });
        profiles;
      };
    };

    familyMembers.add(caller, updatedProfiles);
    profileId;
  };

  public query ({ caller }) func listFamilyMembers() : async [FamilyMemberProfile] {
    requireUser(caller);
    switch (familyMembers.get(caller)) {
      case (null) { [] };
      case (?profiles) { profiles.values().toArray() };
    };
  };

  public shared ({ caller }) func deleteFamilyMember(profileId : Text) : async () {
    requireUser(caller);

    switch (familyMembers.get(caller)) {
      case (null) { Runtime.trap("Family member does not exist") };
      case (?profiles) {
        profiles.remove(profileId);
        if (profiles.isEmpty()) {
          familyMembers.remove(caller);
        };
      };
    };

    let allRecords = getAllRecordsForUser(caller);
    if (allRecords.familyMembers.containsKey(profileId)) {
      let updatedFamilyMembers = allRecords.familyMembers;
      updatedFamilyMembers.remove(profileId);
      updateAllRecordsForUser(caller, { allRecords with familyMembers = updatedFamilyMembers });
    };
  };

  // Medical record functions

  public query ({ caller }) func hasMedicalRecordAccess() : async Bool {
    requireUser(caller);
    true;
  };

  public shared ({ caller }) func addMedicalRecord(recordId : Text, recordDate : Int, recordType : RecordType, data : Text, familyMemberId : ?Text) : async () {
    requireUser(caller);

    let record : MedicalRecord = {
      recordDate;
      recordType;
      recordId;
      data;
    };

    let allRecords = getAllRecordsForUser(caller);

    switch (familyMemberId) {
      case (null) {
        // Add record to personal records
        let updated = allRecords.personalRecords;
        updated.add(recordId, record);
        let newRecords = {
          allRecords with
          personalRecords = updated;
        };
        updateAllRecordsForUser(caller, newRecords);
      };
      case (?memberId) {
        // Add record to specific family member
        if (not allRecords.familyMembers.containsKey(memberId)) {
          Runtime.trap("Family member does not exist");
        };

        let memberRecords = switch (allRecords.familyMembers.get(memberId)) {
          case (null) { Map.empty<Text, MedicalRecord>() };
          case (?existing) { existing };
        };

        memberRecords.add(recordId, record);

        let updatedFamilyMembers = allRecords.familyMembers;
        updatedFamilyMembers.add(memberId, memberRecords);

        let newRecords = {
          allRecords with
          familyMembers = updatedFamilyMembers;
        };
        updateAllRecordsForUser(caller, newRecords);
      };
    };
  };

  public shared ({ caller }) func deleteMedicalRecord(recordId : Text, familyMemberId : ?Text) : async () {
    requireUser(caller);

    let allRecords = getAllRecordsForUser(caller);

    switch (familyMemberId) {
      case (null) {
        if (not allRecords.personalRecords.containsKey(recordId)) {
          Runtime.trap("Record does not exist.");
        } else {
          let updated = allRecords.personalRecords;
          updated.remove(recordId);
          let newRecords = {
            allRecords with
            personalRecords = updated;
          };
          updateAllRecordsForUser(caller, newRecords);
        };
      };
      case (?memberId) {
        if (not allRecords.familyMembers.containsKey(memberId)) {
          Runtime.trap("Family member does not exist");
        };

        switch (allRecords.familyMembers.get(memberId)) {
          case (null) {
            Runtime.trap("Record does not exist for this family member");
          };
          case (?memberRecords) {
            if (not memberRecords.containsKey(recordId)) {
              Runtime.trap("Record does not exist for this family member");
            } else {
              let updatedFamilyMembers = allRecords.familyMembers;
              memberRecords.remove(recordId);
              updatedFamilyMembers.add(memberId, memberRecords);
              let newRecords = {
                allRecords with
                familyMembers = updatedFamilyMembers;
              };
              updateAllRecordsForUser(caller, newRecords);
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getMedicalRecord(recordId : Text, familyMemberId : ?Text) : async MedicalRecord {
    requireUser(caller);

    let allRecords = getAllRecordsForUser(caller);

    switch (familyMemberId) {
      case (null) {
        switch (allRecords.personalRecords.get(recordId)) {
          case (null) { Runtime.trap("Record does not exist.") };
          case (?record) { record };
        };
      };
      case (?memberId) {
        if (not allRecords.familyMembers.containsKey(memberId)) {
          Runtime.trap("Family member does not exist");
        };

        switch (allRecords.familyMembers.get(memberId)) {
          case (null) { Runtime.trap("Record does not exist for this family member") };
          case (?memberRecords) {
            switch (memberRecords.get(recordId)) {
              case (null) { Runtime.trap("Record does not exist for this family member") };
              case (?record) { record };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllRecords(familyMemberId : ?Text) : async [MedicalRecord] {
    requireUser(caller);

    let allRecords = getAllRecordsForUser(caller);

    switch (familyMemberId) {
      case (null) {
        allRecords.personalRecords.values().toArray().sort();
      };
      case (?memberId) {
        switch (allRecords.familyMembers.get(memberId)) {
          case (null) {
            [];
          };
          case (?records) {
            records.values().toArray().sort();
          };
        };
      };
    };
  };

  public query ({ caller }) func getRecordsByType(recordType : RecordType, familyMemberId : ?Text) : async [MedicalRecord] {
    requireUser(caller);

    let filtered = List.empty<MedicalRecord>();

    let allRecords = getAllRecordsForUser(caller);

    switch (familyMemberId) {
      case (null) {
        for ((_, record) in allRecords.personalRecords.entries()) {
          if (record.recordType == recordType) {
            filtered.add(record);
          };
        };
      };
      case (?memberId) {
        switch (allRecords.familyMembers.get(memberId)) {
          case (null) { return [] };
          case (?memberRecords) {
            for ((_, record) in memberRecords.entries()) {
              if (record.recordType == recordType) {
                filtered.add(record);
              };
            };
          };
        };
      };
    };
    filtered.toArray();
  };

  public query ({ caller }) func recordExists(recordId : Text, familyMemberId : ?Text) : async Bool {
    requireUser(caller);

    let allRecords = getAllRecordsForUser(caller);

    switch (familyMemberId) {
      case (null) {
        allRecords.personalRecords.containsKey(recordId);
      };
      case (?memberId) {
        if (not allRecords.familyMembers.containsKey(memberId)) {
          return false;
        };

        switch (allRecords.familyMembers.get(memberId)) {
          case (null) { false };
          case (?records) { records.containsKey(recordId) };
        };
      };
    };
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
    switch (userFiles.get(caller)) {
      case (?permFiles) {
        for ((fileId, blob) in permFiles.entries()) {
          files.add(fileId, blob);
        };
      };
      case (null) {};
    };

    files.toArray();
  };

  public shared ({ caller }) func deleteUploadedFile(fileId : Text, isTemporary : Bool) : async () {
    requireUser(caller);

    switch (isTemporary) {
      case (true) {
        switch (temporaryFiles.get(caller)) {
          case (?tempFiles) {
            if (not tempFiles.containsKey(fileId)) {
              Runtime.trap("Temporary file not found");
            };
            tempFiles.remove(fileId);
            if (tempFiles.isEmpty()) {
              temporaryFiles.remove(caller);
            };
          };
          case (null) { Runtime.trap("Temporary file not found") };
        };
      };
      case (false) {
        switch (userFiles.get(caller)) {
          case (null) { Runtime.trap("File not found") };
          case (?files) {
            if (not files.containsKey(fileId)) {
              Runtime.trap("File not found or not owned by caller");
            };
            files.remove(fileId);
            if (files.isEmpty()) {
              userFiles.remove(caller);
            };
          };
        };
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
      let userSpecificFiles = switch (userFiles.get(caller)) {
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

      userFiles.add(caller, userSpecificFiles);

      // Store metadata
      let meta : RecordMetadata = {
        fileName = fileId;
        uploadTimestamp = 0; // replace with actual timestamp
        owner = caller;
      };
      recordMetadata.add(fileId, meta);
    };

    fileId;
  };

  public query ({ caller }) func listUserFiles() : async [(Text, Storage.ExternalBlob)] {
    requireUser(caller);
    switch (userFiles.get(caller)) {
      case (null) { [] };
      case (?files) { files.toArray() };
    };
  };

  public query ({ caller }) func getRecordDetails(recordId : Text) : async ?Storage.ExternalBlob {
    requireUser(caller);

    switch (userFiles.get(caller)) {
      case (null) { return null };
      case (?files) { return files.get(recordId) };
    };
  };

  public shared ({ caller }) func deleteRecord(recordId : Text) : async () {
    requireUser(caller);

    switch (userFiles.get(caller)) {
      case (null) { Runtime.trap("No files found for user") };
      case (?files) {
        if (not files.containsKey(recordId)) {
          Runtime.trap("File not found or not owned by caller");
        };
        files.remove(recordId);
        if (files.isEmpty()) {
          userFiles.remove(caller);
        } else {
          userFiles.add(caller, files);
        };
      };
    };
  };

  public query ({ caller }) func getUserRecords() : async [(Text, Storage.ExternalBlob)] {
    requireUser(caller);
    switch (userFiles.get(caller)) {
      case (null) { [] };
      case (?files) { files.toArray() };
    };
  };
};
