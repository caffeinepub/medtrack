import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldActor = {
    users : Map.Map<Principal, Map.Map<Text, { recordDate : Int; recordType : { #CBC; #LFT; #Cholesterol; #BloodSugar; #BloodPressure; #GeneralAilments }; recordId : Text; data : Text }>>;
  };

  type NewActor = {
    users : Map.Map<Principal, Map.Map<Text, { recordDate : Int; recordType : { #CBC; #LFT; #Cholesterol; #BloodSugar; #BloodPressure; #GeneralAilments }; recordId : Text; data : Text }>>;
    temporaryFiles : Map.Map<Principal, Map.Map<Text, Storage.ExternalBlob>>;
    uploadedFiles : Map.Map<Text, Storage.ExternalBlob>;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      temporaryFiles = Map.empty<Principal, Map.Map<Text, Storage.ExternalBlob>>();
      uploadedFiles = Map.empty<Text, Storage.ExternalBlob>();
    };
  };
};
