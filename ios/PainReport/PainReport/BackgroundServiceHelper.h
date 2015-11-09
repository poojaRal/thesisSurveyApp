//
//  BackgroundServiceHelper.h
//  PainReport
//
//  Created by HEAL ASU on 3/9/15.
//  Copyright (c) 2015 cnmc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface BackgroundServiceHelper : NSObject
@property NSMutableData *responseData;
-(void)start;
-(void)issueNotification;
@end
