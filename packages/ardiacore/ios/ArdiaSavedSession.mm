#import "ArdiaSavedSession.h"

namespace {

template <typename T>
T *Typed(id value) {
  return [value isKindOfClass:[T class]] ? value : nil;
}

NSArray<NSDictionary *> *Dictionaries(id value) {
  NSMutableArray<NSDictionary *> *out = [NSMutableArray array];
  for (id item in Typed<NSArray>(value) ?: @[])
    if ([item isKindOfClass:NSDictionary.class]) [out addObject:item];
  return out;
}

}

@implementation ArdiaSavedSession

+ (NSInteger)version {
  return 4;
}

+ (instancetype)readFrom:(NSString *)directory {
  NSData *data = directory ? [NSData dataWithContentsOfFile:[directory stringByAppendingPathComponent:@"session.json"]] : nil;
  NSDictionary *document = Typed<NSDictionary>(data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil);
  if (!document) return nil;
  id version = document[@"version"];
  if (version && !([Typed<NSNumber>(version) integerValue] >= 0 && [Typed<NSNumber>(version) integerValue] <= self.version)) return nil;
  return [[self alloc] initWithDocument:document];
}

+ (instancetype)atLaunch:(NSString *)directory {
  static ArdiaSavedSession *session;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    session = [self readFrom:directory];
  });
  return session;
}

- (instancetype)initWithDocument:(NSDictionary *)document {
  if ((self = [super init])) {
    _focusedWindowId = Typed<NSString>(document[@"focusedWindowId"]);
    _linkProfile = Typed<NSString>(document[@"linkProfile"]);
    NSDictionary *hint = Typed<NSDictionary>(document[@"launchTab"]);
    NSString *key = Typed<NSString>(hint[@"id"]), *url = Typed<NSString>(hint[@"url"]), *profile = Typed<NSString>(hint[@"profile"]);
    if (key && url && profile) {
      _launchTabId = key;
      _launchTabURL = url;
      _launchTabProfile = profile;
    }
    _launchBackdrop = Typed<NSDictionary>(document[@"launchBackdrop"]);
    _settings = Typed<NSDictionary>(document[@"settings"]) ?: @{};
    _profiles = document[@"profiles"];
    _windows = Dictionaries(document[@"windows"]);
    _tabs = Dictionaries(document[@"tabs"]);
    _groups = Dictionaries(document[@"groups"]);
    _splits = Dictionaries(document[@"splits"]);
  }
  return self;
}

- (NSDictionary *)windowWithId:(NSString *)windowId {
  for (NSDictionary *window in _windows)
    if ([window[@"id"] isEqual:windowId]) return window;
  return nil;
}

@end
